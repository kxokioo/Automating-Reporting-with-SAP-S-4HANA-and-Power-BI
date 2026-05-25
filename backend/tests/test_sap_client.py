import pytest
from app.services.sap_client import SapClient, sap_client

def test_sap_client_headers():
    client = SapClient()
    headers = client.get_headers()
    assert "Accept" in headers
    assert "Content-Type" in headers
    assert headers["sap-client"] == client.client_id
    assert headers["Authorization"].startswith("Basic ")

def test_sap_client_mock_data():
    client = SapClient()
    client.use_mock = True
    
    journals = client.fetch_journal_entries()
    assert len(journals) == 150
    assert "AccountingDocument" in journals[0]
    assert "AmountInTransactionCurrency" in journals[0]
    assert "GLAccount" in journals[0]
    assert "Segment" in journals[0]
    
    products = client.fetch_product_inventory()
    assert len(products) > 0
    assert "Material" in products[0]
    assert "StockQuantity" in products[0]
    assert "Plant" in products[0]

def test_sap_client_bw_query():
    client = SapClient()
    client.use_mock = True
    
    bw_data = client.fetch_bw_analytics_cubes("FIN_GL_01")
    assert bw_data["query_name"] == "FIN_GL_01"
    assert "results" in bw_data
    assert len(bw_data["results"]) > 0
