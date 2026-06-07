import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import Base, get_db
from app.database.models import User, SapConnection, EtlPipeline

# Create a temporary SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_aetheris_api.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Register test user profiles
    from app.routers.auth import get_password_hash
    admin_user = User(username="testadmin", hashed_password=get_password_hash("Admin123!"), role="Admin")
    analyst_user = User(username="testanalyst", hashed_password=get_password_hash("Analyst123!"), role="FinancialAnalyst")
    db.add(admin_user)
    db.add(analyst_user)
    
    # Pre-populate some pipelines
    pipeline = EtlPipeline(
        id=1,
        name="Test FICO Pipeline",
        source_system="SAP S/4HANA OData Core",
        target_table="financial_records",
        schedule_cron="*/30 * * * *",
        last_run_status="NEVER",
        is_active=True
    )
    db.add(pipeline)
    db.commit()
    db.close()
    
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_aetheris_api.db"):
        try:
            os.remove("./test_aetheris_api.db")
        except:
            pass

client = TestClient(app)

def get_auth_header(username, password):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_sap_schema_endpoint():
    headers = get_auth_header("testadmin", "Admin123!")
    response = client.get("/api/v1/sap/schema", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert "tables" in data
    assert "BKPF" in data["tables"]

def test_sap_query_endpoint():
    headers = get_auth_header("testadmin", "Admin123!")
    
    # Query journal entries
    res_je = client.get("/api/v1/sap/query?service=API_JOURNALENTRY_SRV&entity=A_JournalEntry&top=5", headers=headers)
    assert res_je.status_code == 200
    assert len(res_je.json()["d"]["results"]) == 5
    
    # Query products
    res_pr = client.get("/api/v1/sap/query?service=API_PRODUCT_SRV&entity=A_Product&top=2", headers=headers)
    assert res_pr.status_code == 200
    assert len(res_pr.json()["d"]["results"]) == 2

def test_etl_pipelines_list():
    headers = get_auth_header("testanalyst", "Analyst123!")
    response = client.get("/api/v1/etl/pipelines", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["name"] == "Test FICO Pipeline"

def test_etl_trigger_restricted():
    # Only Admin should be allowed to trigger pipelines
    headers = get_auth_header("testanalyst", "Analyst123!")
    response = client.post("/api/v1/etl/trigger/1", headers=headers)
    assert response.status_code == 403

def test_etl_trigger_success():
    headers = get_auth_header("testadmin", "Admin123!")
    response = client.post("/api/v1/etl/trigger/1", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "RUNNING"

def test_powerbi_embed_token():
    headers = get_auth_header("testanalyst", "Analyst123!")
    response = client.post("/api/v1/powerbi/embed-token", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Authenticated"
    assert "accessToken" in data
    assert "Finance_Global" in data["rlsContext"]["roles"]
    .