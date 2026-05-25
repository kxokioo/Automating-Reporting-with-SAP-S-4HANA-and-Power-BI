from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Viewer", nullable=False)  # Admin, FinancialAnalyst, LogisticsManager, Viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class SapConnection(Base):
    __tablename__ = "sap_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    system_type = Column(String, nullable=False)  # S4HANA, BW4HANA
    base_url = Column(String, nullable=False)
    client = Column(String, nullable=False)
    username = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EtlPipeline(Base):
    __tablename__ = "etl_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source_system = Column(String, nullable=False)  # SAP S/4HANA OData, SAP BW/4HANA
    target_table = Column(String, nullable=False)   # financial_records, logistics_records
    schedule_cron = Column(String, nullable=False)  # Cron pattern
    last_run_status = Column(String, default="NEVER")  # SUCCESS, FAILED, RUNNING, NEVER
    last_run_time = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    job_logs = relationship("EtlJobLog", back_populates="pipeline", cascade="all, delete-orphan")

class EtlJobLog(Base):
    __tablename__ = "etl_job_logs"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("etl_pipelines.id"), nullable=False)
    status = Column(String, nullable=False)  # RUNNING, SUCCESS, FAILED
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    records_processed = Column(Integer, default=0)
    logs_text = Column(Text, nullable=True)

    pipeline = relationship("EtlPipeline", back_populates="job_logs")

class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    posting_date = Column(DateTime, nullable=False)
    account_number = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    company_code = Column(String, nullable=False, index=True)
    segment = Column(String, nullable=False, index=True)  # North America, Europe, Asia-Pacific
    cost_center = Column(String, nullable=True)
    sap_doc_id = Column(String, nullable=False)  # Reference to the actual SAP document

class LogisticsRecord(Base):
    __tablename__ = "logistics_records"

    id = Column(Integer, primary_key=True, index=True)
    material_number = Column(String, nullable=False)
    material_desc = Column(String, nullable=False)
    plant = Column(String, nullable=False, index=True)
    stock_qty = Column(Float, nullable=False)
    safety_stock = Column(Float, nullable=False)
    sales_order_qty = Column(Float, nullable=False)
    fulfillment_days = Column(Integer, nullable=False)
    vendor_name = Column(String, nullable=False)
    supplier_score = Column(Float, nullable=False)  # 0 to 100
    sync_date = Column(DateTime, default=datetime.utcnow, index=True)
