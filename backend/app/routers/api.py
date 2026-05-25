from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional, List
from app.database.session import get_db
from app.database.models import (
    FinancialRecord, LogisticsRecord, EtlPipeline, EtlJobLog, SapConnection
)
from app.routers.auth import get_current_user, RoleChecker, User
from app.services.etl_engine import EtlOrchestrator, get_pipeline_progress
from app.services.sap_client import sap_client

router = APIRouter(tags=["Enterprise APIs"])

# ==========================================
# 1. ANALYTICS & KPI METRICS ENDPOINTS
# ==========================================

@router.get("/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get executive summary stats across Finance and Logistics domains
    """
    # Financial Stats (Sum all positive amounts as debits/cogs and negative as revenues)
    # Note: Our sap entries generate revenue as negative credit amounts and expenses as positive debit amounts
    revenue_sum = db.query(func.sum(FinancialRecord.amount)).filter(FinancialRecord.amount < 0).scalar() or 0
    expense_sum = db.query(func.sum(FinancialRecord.amount)).filter(FinancialRecord.amount > 0).scalar() or 0
    
    # Absolute revenue representation
    revenue = abs(revenue_sum)
    cogs = expense_sum
    ebitda = revenue - cogs
    
    # Logistics stats
    total_materials = db.query(func.count(LogisticsRecord.id)).scalar() or 0
    under_stock_count = db.query(func.count(LogisticsRecord.id)).filter(
        LogisticsRecord.stock_qty < LogisticsRecord.safety_stock
    ).scalar() or 0
    
    avg_supplier_score = db.query(func.avg(LogisticsRecord.supplier_score)).scalar() or 0.0
    avg_lead_time = db.query(func.avg(LogisticsRecord.fulfillment_days)).scalar() or 0.0

    return {
        "financials": {
            "total_revenue": round(revenue, 2),
            "total_cogs": round(cogs, 2),
            "ebitda": round(ebitda, 2),
            "profit_margin_pct": round((ebitda / revenue * 100) if revenue > 0 else 0, 2)
        },
        "logistics": {
            "active_skus": total_materials,
            "critical_stockout_risk": under_stock_count,
            "average_supplier_reliability_score": round(avg_supplier_score, 1),
            "average_fulfillment_days": round(avg_lead_time, 1)
        }
    }

@router.get("/analytics/financials")
def get_financial_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "FinancialAnalyst"]))
):
    """
    Get detailed multi-dimensional Financial breakdown (FICO)
    """
    # Segment breakdown
    segment_data = db.query(
        FinancialRecord.segment,
        func.sum(FinancialRecord.amount)
    ).group_by(FinancialRecord.segment).all()
    
    segments = []
    for seg, amt in segment_data:
        # Amount represents net position, calculate breakdown
        segments.append({
            "segment": seg,
            "value": round(abs(amt), 2)
        })

    # Account Breakdown (Expenses vs Revenues)
    account_data = db.query(
        FinancialRecord.account_number,
        FinancialRecord.account_name,
        func.sum(FinancialRecord.amount)
    ).group_by(FinancialRecord.account_number, FinancialRecord.account_name).all()

    accounts = []
    for num, name, amt in account_data:
        accounts.append({
            "account_number": num,
            "account_name": name,
            "net_amount": round(amt, 2),
            "category": "Revenue" if num.startswith("4") else "Expense" if (num.startswith("5") or num.startswith("6")) else "Balance Sheet"
        })

    # Time series mock (last 4 months aggregation)
    time_series = [
        {"month": "Jan 2026", "revenue": 1240000.0, "budget": 1150000.0, "cogs": 610000.0},
        {"month": "Feb 2026", "revenue": 1310000.0, "budget": 1200000.0, "cogs": 630000.0},
        {"month": "Mar 2026", "revenue": 1450000.0, "budget": 1350000.0, "cogs": 680000.0},
        {"month": "Apr 2026", "revenue": 1580000.0, "budget": 1450000.0, "cogs": 710000.0}
    ]

    return {
        "segments": segments,
        "accounts": accounts,
        "trends": time_series
    }

@router.get("/analytics/logistics")
def get_logistics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "LogisticsManager"]))
):
    """
    Get material inventory and fulfillment statistics (MM/SD)
    """
    items = db.query(LogisticsRecord).all()
    
    sku_list = []
    for it in items:
        sku_list.append({
            "material_number": it.material_number,
            "description": it.material_desc,
            "plant": it.plant,
            "stock": it.stock_qty,
            "safety_stock": it.safety_stock,
            "sales_order_demand": it.sales_order_qty,
            "fulfillment_lead_days": it.fulfillment_days,
            "preferred_vendor": it.vendor_name,
            "supplier_score": it.supplier_score,
            "under_safety": it.stock_qty < it.safety_stock
        })
    
    # Plant distribution
    plant_data = db.query(
        LogisticsRecord.plant,
        func.count(LogisticsRecord.id),
        func.sum(LogisticsRecord.stock_qty)
    ).group_by(LogisticsRecord.plant).all()

    plants = []
    for pl, count, total_qty in plant_data:
        plants.append({
            "plant": pl,
            "sku_count": count,
            "total_inventory": round(total_qty or 0, 2)
        })

    return {
        "skus": sku_list,
        "plants": plants
    }

# ==========================================
# 2. SAP ODATA EXPLORER ENDPOINTS
# ==========================================

@router.get("/sap/schema")
def get_sap_schemas(current_user: User = Depends(get_current_user)):
    """
    Reflect database schema metadata for simulated SAP S/4HANA tables
    """
    return {
        "system": "SAP S/4HANA OData Core V4",
        "api_services": [
            {
                "service_name": "API_JOURNALENTRY_SRV",
                "entity_sets": ["A_JournalEntry", "A_JournalEntryItem"],
                "table_mappings": ["BKPF", "BSEG"],
                "description": "General Ledger Accounting Documents & Journal Entries"
            },
            {
                "service_name": "API_PRODUCT_SRV",
                "entity_sets": ["A_Product", "A_ProductPlant", "A_ProductStorage"],
                "table_mappings": ["MARA", "MARC", "MARD"],
                "description": "Material Master & Storage Locations Inventory"
            },
            {
                "service_name": "API_SALES_ORDER_SRV",
                "entity_sets": ["A_SalesOrder", "A_SalesOrderItem"],
                "table_mappings": ["VBAK", "VBAP"],
                "description": "Customer Sales Contract Headers & Schedules"
            }
        ],
        "tables": {
            "BKPF": {
                "description": "Accounting Document Header",
                "columns": ["MANDT (Client)", "BUKRS (Company Code)", "BELNR (Doc Number)", "GJAHR (Year)", "BUDAT (Posting Date)"]
            },
            "BSEG": {
                "description": "Accounting Document Segment (Line Items)",
                "columns": ["BUKRS (Company)", "BELNR (Doc Number)", "BUZEI (Item Index)", "HKONT (G/L Account)", "WRBTR (Amount)"]
            },
            "MARA": {
                "description": "General Material Data",
                "columns": ["MATNR (Material ID)", "ERSDA (Created Date)", "ERNAM (Created By)", "MTART (Material Type)", "MEINS (Base Unit)"]
            }
        }
    }

@router.get("/sap/query")
def query_sap_odata(
    service: str = "API_JOURNALENTRY_SRV",
    entity: str = "A_JournalEntry",
    top: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """
    Execute structured OData GET simulation against the SAP Client module
    """
    if service == "API_JOURNALENTRY_SRV" and entity == "A_JournalEntry":
        data = sap_client.fetch_journal_entries()
        return {"d": {"results": data[:top]}}
    elif service == "API_PRODUCT_SRV" and entity == "A_Product":
        data = sap_client.fetch_product_inventory()
        return {"d": {"results": data[:top]}}
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Mock implementation not found for Service: {service}, Entity: {entity}."
        )

# ==========================================
# 3. ETL PIPELINES & TELEMETRY ENDPOINTS
# ==========================================

@router.get("/etl/pipelines", response_model=List[dict])
def get_pipelines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pipelines = db.query(EtlPipeline).all()
    result = []
    for p in pipelines:
        # Get active background status if running
        progress = get_pipeline_progress(p.id)
        status = progress["status"] if progress["status"] != "IDLE" else p.last_run_status
        
        result.append({
            "id": p.id,
            "name": p.name,
            "source_system": p.source_system,
            "target_table": p.target_table,
            "schedule_cron": p.schedule_cron,
            "last_run_status": status,
            "last_run_time": p.last_run_time,
            "is_active": p.is_active
        })
    return result

@router.post("/etl/trigger/{pipeline_id}")
def trigger_etl_pipeline(
    pipeline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    pipeline = db.query(EtlPipeline).filter(EtlPipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline profile not found.")
    
    # Fire background thread
    return EtlOrchestrator.trigger_pipeline(pipeline.id)

@router.get("/etl/progress/{pipeline_id}")
def get_etl_progress(
    pipeline_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Yields live step-by-step progress metrics and execution log buffers
    """
    return get_pipeline_progress(pipeline_id)

@router.get("/etl/logs/{pipeline_id}")
def get_pipeline_logs(
    pipeline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Queries past database logs for historically executed ETL jobs
    """
    logs = db.query(EtlJobLog).filter(
        EtlJobLog.pipeline_id == pipeline_id
    ).order_by(EtlJobLog.start_time.desc()).all()
    
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "status": l.status,
            "start_time": l.start_time,
            "end_time": l.end_time,
            "records_processed": l.records_processed,
            "logs_text": l.logs_text
        })
    return result

# ==========================================
# 4. POWER BI EMBEDDING ENDPOINT
# ==========================================

@router.post("/powerbi/embed-token")
def generate_powerbi_embed(
    workspace_id: str = "ws-aetheris-analytics-2026",
    report_id: str = "rep-sap-executive-dashboard",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates Microsoft Azure AD App-Owns-Data client credentials flow,
    obtaining access tokens, generating specific Row-Level Security (RLS) filters.
    """
    # Map roles to specific Power BI Row-Level Security contexts
    rls_roles = ["Viewer"]
    rls_username = current_user.username
    
    if current_user.role == "Admin":
        rls_roles = ["Admin", "Finance_Global", "Logistics_Global"]
    elif current_user.role == "FinancialAnalyst":
        rls_roles = ["Finance_Global"]
    elif current_user.role == "LogisticsManager":
        rls_roles = ["Logistics_Global"]

    # Generate realistic secure payload
    return {
        "status": "Authenticated",
        "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=rep-sap-executive-dashboard&groupId=ws-aetheris-analytics-2026",
        "reportId": report_id,
        "workspaceId": workspace_id,
        "tokenType": "EmbedToken",
        "accessToken": f"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJuYW1laWQiOiJzYXAtYXBwIiwiaXNzIjoiUG93ZXJCSUVtYmVkZCIsInJsc19yb2xlcyI6e3Jsc19yb2xlc319.securemocksignature",
        "rlsContext": {
            "username": rls_username,
            "roles": rls_roles,
            "effective_identities": [
                {
                    "username": rls_username,
                    "roles": rls_roles,
                    "datasets": ["ds-sap-olap-cube-01"]
                }
            ]
        },
        "expiration": (datetime.utcnow() + timedelta(hours=1)).isoformat()
    }
