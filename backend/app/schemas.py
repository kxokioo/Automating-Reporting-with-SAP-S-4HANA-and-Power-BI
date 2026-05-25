"""
Pydantic request/response schemas for input validation and API documentation.
"""
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from typing import Optional, List


# ============================================
# Authentication Schemas
# ============================================

class UserCreate(BaseModel):
    """Request schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50, regex="^[a-zA-Z0-9_.-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="Viewer", regex="^(Admin|FinancialAnalyst|LogisticsManager|Viewer)$")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Ensure password meets minimum complexity requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserResponse(BaseModel):
    """Response schema for user endpoints"""
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for authentication token"""
    access_token: str
    token_type: str
    role: str
    username: str
    expires_in: int


# ============================================
# SAP Connection Schemas
# ============================================

class SapConnectionCreate(BaseModel):
    """Request schema for creating SAP connection"""
    name: str = Field(..., min_length=1, max_length=200)
    system_type: str = Field(..., regex="^(S4HANA|BW4HANA)$")
    base_url: str = Field(..., min_length=10)
    client: str = Field(..., min_length=1, max_length=10)
    username: str = Field(..., min_length=1, max_length=100)


class SapConnectionResponse(BaseModel):
    """Response schema for SAP connection"""
    id: int
    name: str
    system_type: str
    base_url: str
    client: str
    username: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# ETL Pipeline Schemas
# ============================================

class EtlPipelineCreate(BaseModel):
    """Request schema for creating ETL pipeline"""
    name: str = Field(..., min_length=1, max_length=200)
    source_system: str = Field(..., min_length=1, max_length=100)
    target_table: str = Field(..., min_length=1, max_length=100, regex="^[a-z_][a-z0-9_]*$")
    schedule_cron: str = Field(..., min_length=5, max_length=100)


class EtlPipelineResponse(BaseModel):
    """Response schema for ETL pipeline"""
    id: int
    name: str
    source_system: str
    target_table: str
    schedule_cron: str
    last_run_status: str
    last_run_time: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class EtlJobLogResponse(BaseModel):
    """Response schema for ETL job logs"""
    id: int
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    records_processed: int
    logs_text: Optional[str]

    class Config:
        from_attributes = True


# ============================================
# Financial Record Schemas
# ============================================

class FinancialRecordResponse(BaseModel):
    """Response schema for financial records"""
    id: int
    posting_date: datetime
    account_number: str
    account_name: str
    amount: float
    currency: str
    company_code: str
    segment: str
    cost_center: Optional[str]
    sap_doc_id: str

    class Config:
        from_attributes = True


# ============================================
# Logistics Record Schemas
# ============================================

class LogisticsRecordResponse(BaseModel):
    """Response schema for logistics records"""
    id: int
    material_number: str
    material_desc: str
    plant: str
    stock_qty: float
    safety_stock: float
    sales_order_qty: float
    fulfillment_days: int
    vendor_name: str
    supplier_score: float
    sync_date: datetime

    class Config:
        from_attributes = True


# ============================================
# Analytics Schemas
# ============================================

class FinancialMetrics(BaseModel):
    """Financial metrics response"""
    total_revenue: float
    total_cogs: float
    ebitda: float
    profit_margin_pct: float


class LogisticsMetrics(BaseModel):
    """Logistics metrics response"""
    active_skus: int
    critical_stockout_risk: int
    average_supplier_reliability_score: float
    average_fulfillment_days: float


class AnalyticsOverviewResponse(BaseModel):
    """Response schema for analytics overview"""
    financials: FinancialMetrics
    logistics: LogisticsMetrics


# ============================================
# Error Response Schemas
# ============================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    status_code: int
    message: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# Power BI Schemas
# ============================================

class PowerBiEmbedTokenResponse(BaseModel):
    """Response schema for Power BI embed token"""
    status: str
    embedUrl: str
    reportId: str
    workspaceId: str
    tokenType: str
    accessToken: str
    rlsContext: dict
    expiration: str
