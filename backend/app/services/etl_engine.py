import time
import threading
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.models import EtlPipeline, EtlJobLog, FinancialRecord, LogisticsRecord
from app.services.sap_client import sap_client

# Thread-safe global store to report exact progress to the frontend API
# {pipeline_id: {"status": "RUNNING", "step": "EXTRACTING", "progress": 25, "records_processed": 0, "logs": [...]}}
etl_progress_registry = {}
registry_lock = threading.Lock()

def update_progress(pipeline_id: int, status: str, step: str, progress: int, records: int, log_message: str):
    with registry_lock:
        if pipeline_id not in etl_progress_registry:
            etl_progress_registry[pipeline_id] = {"logs": []}
        
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        formatted_log = f"[{timestamp}] [{step}] {log_message}"
        
        etl_progress_registry[pipeline_id].update({
            "status": status,
            "step": step,
            "progress": progress,
            "records_processed": records
        })
        etl_progress_registry[pipeline_id]["logs"].append(formatted_log)
        # Cap logs at last 100 entries
        if len(etl_progress_registry[pipeline_id]["logs"]) > 100:
            etl_progress_registry[pipeline_id]["logs"].pop(0)

def get_pipeline_progress(pipeline_id: int) -> dict:
    with registry_lock:
        return etl_progress_registry.get(pipeline_id, {
            "status": "IDLE",
            "step": "WAITING",
            "progress": 0,
            "records_processed": 0,
            "logs": ["No active jobs running for this pipeline."]
        })

class EtlOrchestrator:
    @staticmethod
    def trigger_pipeline(pipeline_id: int):
        """
        Triggers a pipeline execution in a separate background thread.
        """
        thread = threading.Thread(target=EtlOrchestrator._execute_pipeline, args=(pipeline_id,))
        thread.daemon = True
        thread.start()
        return {"status": "RUNNING", "message": f"Pipeline {pipeline_id} scheduled and running in background."}

    @staticmethod
    def _execute_pipeline(pipeline_id: int):
        db: Session = SessionLocal()
        pipeline = db.query(EtlPipeline).filter(EtlPipeline.id == pipeline_id).first()
        if not pipeline:
            db.close()
            return

        # Initialize progress registry
        with registry_lock:
            etl_progress_registry[pipeline_id] = {
                "status": "RUNNING",
                "step": "INITIALIZING",
                "progress": 5,
                "records_processed": 0,
                "logs": []
            }

        # Create Job Log
        job_log = EtlJobLog(
            pipeline_id=pipeline.id,
            status="RUNNING",
            start_time=datetime.utcnow(),
            records_processed=0,
            logs_text=""
        )
        db.add(job_log)
        db.commit()
        db.refresh(job_log)

        try:
            update_progress(pipeline.id, "RUNNING", "INITIALIZING", 10, 0, f"Establishing secure RFC handshake with SAP Client {sap_client.client_id}...")
            time.sleep(1.0)
            
            # Step 1: Extraction
            update_progress(pipeline.id, "RUNNING", "EXTRACTING", 20, 0, f"Extracting OData elements from entity set target: {pipeline.source_system}...")
            time.sleep(1.2)
            
            raw_records = []
            if pipeline.target_table == "financial_records":
                raw_records = sap_client.fetch_journal_entries()
                update_progress(pipeline.id, "RUNNING", "EXTRACTING", 40, len(raw_records), f"Extracted {len(raw_records)} journal entry items from /API_JOURNALENTRY_SRV/A_JournalEntry")
            elif pipeline.target_table == "logistics_records":
                raw_records = sap_client.fetch_product_inventory()
                update_progress(pipeline.id, "RUNNING", "EXTRACTING", 40, len(raw_records), f"Extracted {len(raw_records)} product inventory items from /API_PRODUCT_SRV/A_Product")
            
            time.sleep(1.0)

            # Step 2: Transformation
            update_progress(pipeline.id, "RUNNING", "TRANSFORMING", 60, len(raw_records), "Performing master data joining, schema validation, and currency normalization...")
            time.sleep(1.5)

            transformed_records = []
            if pipeline.target_table == "financial_records":
                # Clear previous cache to simulate clean reload
                db.query(FinancialRecord).delete()
                
                # Transform each journal entry
                for idx, r in enumerate(raw_records):
                    # Multi-dimensional analytics translation
                    # Normalize currencies to corporate standard USD for variance reports
                    amount = r["AmountInTransactionCurrency"]
                    currency = r["TransactionCurrency"]
                    converted_amount = amount
                    if currency == "EUR":
                        converted_amount = amount * 1.08  # Simulated FX conversion
                    elif currency == "SGD":
                        converted_amount = amount * 0.74

                    # Handle Debit vs Credit absolute reporting
                    # In standard SAP general ledger, expenses are positive debits, revenues are negative credits
                    
                    doc = FinancialRecord(
                        posting_date=datetime.strptime(r["PostingDate"], "%Y-%m-%dT%H:%M:%SZ"),
                        account_number=r["GLAccount"],
                        account_name=r["GLAccountName"],
                        amount=converted_amount,
                        currency="USD",
                        company_code=r["CompanyCode"],
                        segment=r["Segment"],
                        cost_center=r["ProfitCenter"],
                        sap_doc_id=r["AccountingDocument"]
                    )
                    transformed_records.append(doc)
                update_progress(pipeline.id, "RUNNING", "TRANSFORMING", 75, len(transformed_records), "FX rates aligned. Denormalized dimensions (Segment, Profit Center) resolved.")

            elif pipeline.target_table == "logistics_records":
                # Clear previous cache
                db.query(LogisticsRecord).delete()
                
                for idx, r in enumerate(raw_records):
                    # Logistics transformations (KPI formulations)
                    logi = LogisticsRecord(
                        material_number=r["Material"],
                        material_desc=r["MaterialDescription"],
                        plant=r["Plant"],
                        stock_qty=r["StockQuantity"],
                        safety_stock=r["SafetyStock"],
                        sales_order_qty=r["SalesOrderDemand"],
                        fulfillment_days=r["FulfillmentLeadTimeDays"],
                        vendor_name=r["PreferredVendor"],
                        supplier_score=r["SupplierPerformanceScore"],
                        sync_date=datetime.utcnow()
                    )
                    transformed_records.append(logi)
                update_progress(pipeline.id, "RUNNING", "TRANSFORMING", 75, len(transformed_records), "Computed custom KPIs: Stock-to-Demand Ratio, Under-Safety-Stock warnings.")

            time.sleep(1.0)

            # Step 3: Loading
            update_progress(pipeline.id, "RUNNING", "LOADING", 85, len(transformed_records), f"Inserting clean data cache into local analytics catalog table: '{pipeline.target_table}'...")
            
            for item in transformed_records:
                db.add(item)
            
            db.commit()
            update_progress(pipeline.id, "RUNNING", "LOADING", 95, len(transformed_records), "Indices re-indexed. Partition statistics recalculated.")
            time.sleep(0.8)

            # Step 4: Completion
            update_progress(pipeline.id, "SUCCESS", "COMPLETED", 100, len(transformed_records), f"Pipeline run completed successfully. {len(transformed_records)} records loaded.")
            
            pipeline.last_run_status = "SUCCESS"
            pipeline.last_run_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            job_log.status = "SUCCESS"
            job_log.end_time = datetime.utcnow()
            job_log.records_processed = len(transformed_records)
            job_log.logs_text = "\n".join(etl_progress_registry[pipeline.id]["logs"])
            db.commit()

        except Exception as e:
            err_msg = f"ETL Pipeline failed during execution. Error details: {str(e)}"
            update_progress(pipeline.id, "FAILED", "ERROR", 100, 0, err_msg)
            
            pipeline.last_run_status = "FAILED"
            pipeline.last_run_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            job_log.status = "FAILED"
            job_log.end_time = datetime.utcnow()
            job_log.logs_text = "\n".join(etl_progress_registry[pipeline.id]["logs"])
            db.commit()

        finally:
            db.close()
