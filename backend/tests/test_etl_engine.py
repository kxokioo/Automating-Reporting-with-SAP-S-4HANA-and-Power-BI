import pytest
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.database.models import EtlPipeline, FinancialRecord, LogisticsRecord
from app.services.etl_engine import EtlOrchestrator, get_pipeline_progress, etl_progress_registry
import app.services.etl_engine as etl_engine

# Use in-memory SQLite for ETL testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db(monkeypatch):
    # Override SessionLocal in the ETL engine module to point to our test DB
    monkeypatch.setattr(etl_engine, "SessionLocal", TestingSessionLocal)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test pipelines
    pipeline1 = EtlPipeline(
        id=1,
        name="Test Financials Pipeline",
        source_system="SAP S/4HANA OData Core",
        target_table="financial_records",
        schedule_cron="*/30 * * * *",
        last_run_status="NEVER",
        is_active=True
    )
    pipeline2 = EtlPipeline(
        id=2,
        name="Test Logistics Pipeline",
        source_system="SAP S/4HANA OData Core",
        target_table="logistics_records",
        schedule_cron="0 * * * *",
        last_run_status="NEVER",
        is_active=True
    )
    db.add(pipeline1)
    db.add(pipeline2)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_pipeline_progress_registry():
    progress = get_pipeline_progress(99)
    assert progress["status"] == "IDLE"
    assert progress["step"] == "WAITING"
    
    etl_engine.update_progress(99, "RUNNING", "TEST_STEP", 50, 10, "Test log message")
    progress = get_pipeline_progress(99)
    assert progress["status"] == "RUNNING"
    assert progress["step"] == "TEST_STEP"
    assert progress["progress"] == 50
    assert progress["records_processed"] == 10
    assert len(progress["logs"]) > 0
    assert "Test log message" in progress["logs"][-1]

def test_execute_financial_pipeline():
    # Run the financial ETL pipeline execution synchronously to verify logic
    EtlOrchestrator._execute_pipeline(1)
    
    db = TestingSessionLocal()
    pipeline = db.query(EtlPipeline).filter(EtlPipeline.id == 1).first()
    assert pipeline.last_run_status == "SUCCESS"
    
    # Check that financial records were converted and stored
    records = db.query(FinancialRecord).all()
    assert len(records) == 150
    for r in records:
        assert r.currency == "USD"
        assert r.sap_doc_id.startswith("10000")
        assert r.amount != 0
    db.close()

def test_execute_logistics_pipeline():
    # Run the logistics ETL pipeline synchronously
    EtlOrchestrator._execute_pipeline(2)
    
    db = TestingSessionLocal()
    pipeline = db.query(EtlPipeline).filter(EtlPipeline.id == 2).first()
    assert pipeline.last_run_status == "SUCCESS"
    
    # Check that logistics records were stored
    records = db.query(LogisticsRecord).all()
    assert len(records) > 0
    for r in records:
        assert r.material_number.startswith("MAT-")
        assert r.stock_qty >= 0
    db.close()
