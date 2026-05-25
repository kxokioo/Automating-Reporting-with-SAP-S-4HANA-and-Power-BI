import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import Base, get_db
from app.database.models import User, SapConnection, EtlPipeline

# Create a temporary SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_aetheris.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the database dependency in FastAPI
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Setup test overrides
    app.dependency_overrides[get_db] = override_get_db
    
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    
    # Pre-populate some standard test parameters
    db = TestingSessionLocal()
    pipeline1 = EtlPipeline(
        id=1,
        name="Test Sync",
        source_system="SAP S/4HANA OData Core",
        target_table="financial_records",
        schedule_cron="*/30 * * * *",
        last_run_status="NEVER",
        is_active=True
    )
    db.add(pipeline1)
    db.commit()
    db.close()
    
    yield
    # Clean up overrides
    app.dependency_overrides.pop(get_db, None)
    
    # Clean up test tables and DB file
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_aetheris.db"):
        try:
            os.remove("./test_aetheris.db")
        except:
            pass

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["system"] == "Aetheris Enterprise Gateway"

def test_auth_register_and_login():
    # 1. Register a test analyst
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"username": "testanalyst2", "password": "SecurePass123!", "role": "FinancialAnalyst"}
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["username"] == "testanalyst2"
    assert reg_response.json()["role"] == "FinancialAnalyst"

    # 2. Login to get access token
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "testanalyst2", "password": "SecurePass123!"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["role"] == "FinancialAnalyst"

    # 3. Test access to overview dashboard with the JWT token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    overview_response = client.get("/api/v1/analytics/overview", headers=headers)
    assert overview_response.status_code == 200
    assert "financials" in overview_response.json()
