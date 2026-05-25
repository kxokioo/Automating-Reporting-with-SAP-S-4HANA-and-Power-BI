import random
import base64
from datetime import datetime, timedelta
import requests
from app.config import settings

class SapClient:
    def __init__(self):
        self.base_url = settings.SAP_BASE_URL
        self.client_id = settings.SAP_CLIENT
        self.username = settings.SAP_USERNAME
        self.password = settings.SAP_PASSWORD
        self.use_mock = settings.USE_MOCK_SAP

    def get_headers(self):
        # Dynamically compile the base64-encoded basic authentication header
        creds = f"{self.username}:{self.password}".encode("utf-8")
        base64_creds = base64.b64encode(creds).decode("utf-8")
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "sap-client": self.client_id,
            "Authorization": f"Basic {base64_creds}"
        }

    def fetch_journal_entries(self) -> list:
        """
        Fetch Journal Entries from SAP S/4HANA OData service:
        Service Endpoint: /sap/opu/odata/sap/API_JOURNALENTRY_SRV/A_JournalEntry
        """
        if self.use_mock:
            return self._generate_mock_journal_entries()
        
        try:
            url = f"{self.base_url}/sap/opu/odata/sap/API_JOURNALENTRY_SRV/A_JournalEntry"
            params = {"$top": 100, "$format": "json"}
            response = requests.get(url, headers=self.get_headers(), params=params, timeout=10)
            response.raise_for_status()
            # Parse OData standard json
            data = response.json()
            return data.get("d", {}).get("results", [])
        except Exception as e:
            # Fallback to mock with detailed warning logging
            print(f"[SAP Client Warning] Real SAP connection failed: {str(e)}. Falling back to local high-fidelity mock data.")
            return self._generate_mock_journal_entries()

    def fetch_product_inventory(self) -> list:
        """
        Fetch Product Inventory from SAP S/4HANA OData:
        Service Endpoint: /sap/opu/odata/sap/API_PRODUCT_SRV/A_Product
        """
        if self.use_mock:
            return self._generate_mock_product_inventory()

        try:
            url = f"{self.base_url}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product"
            params = {"$top": 100, "$expand": "to_ProductStorage", "$format": "json"}
            response = requests.get(url, headers=self.get_headers(), params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get("d", {}).get("results", [])
        except Exception as e:
            print(f"[SAP Client Warning] Real SAP inventory connection failed: {str(e)}. Falling back to mock.")
            return self._generate_mock_product_inventory()

    def fetch_bw_analytics_cubes(self, query_name: str = "FIN_GL_01") -> dict:
        """
        Fetch multi-dimensional aggregates from SAP BW/4HANA Analytical Queries
        """
        if self.use_mock:
            return self._generate_mock_bw_query(query_name)

        try:
            url = f"{self.base_url}/sap/opu/odata/sap/BW_ANALYTICS_SRV/Queries('{query_name}')/Results"
            response = requests.get(url, headers=self.get_headers(), params={"$format": "json"}, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[SAP Client Warning] BW/4HANA Query '{query_name}' failed: {str(e)}. Falling back to mock aggregates.")
            return self._generate_mock_bw_query(query_name)

    # ==========================================
    # HIGH-FIDELITY SAP MOCK RESPONSE GENERATORS
    # ==========================================

    def _generate_mock_journal_entries(self) -> list:
        accounts = [
            ("400000", "Revenue - Product Sales"),
            ("410000", "Revenue - Services Rendered"),
            ("500000", "Cost of Goods Sold (COGS)"),
            ("600000", "Operating Expenses - Salaries"),
            ("610000", "Operating Expenses - Rent"),
            ("620000", "Marketing & Advertising"),
            ("110000", "Cash & Cash Equivalents"),
            ("120000", "Accounts Receivable")
        ]
        segments = ["North America", "Europe", "Asia-Pacific"]
        company_codes = ["US01", "DE01", "SG01"]
        
        entries = []
        now = datetime.utcnow()
        
        # Generate 150 realistic journal entry items
        for i in range(150):
            days_ago = random.randint(0, 90)
            posting_date = now - timedelta(days=days_ago)
            acct_num, acct_name = random.choice(accounts)
            
            # Amount generation: Expense or Revenue mapping
            if acct_num.startswith("4"):  # Revenue (Credit in SAP)
                amount = -round(random.uniform(5000.0, 75000.0), 2)
            elif acct_num.startswith("5") or acct_num.startswith("6"):  # Expense (Debit)
                amount = round(random.uniform(2000.0, 45000.0), 2)
            else:
                amount = round(random.uniform(-10000.0, 10000.0), 2)

            comp_idx = random.randint(0, 2)
            entries.append({
                "CompanyCode": company_codes[comp_idx],
                "AccountingDocument": f"10000{100000 + i}",
                "PostingDate": posting_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "GLAccount": acct_num,
                "GLAccountName": acct_name,
                "AmountInTransactionCurrency": amount,
                "TransactionCurrency": "USD" if comp_idx == 0 else ("EUR" if comp_idx == 1 else "SGD"),
                "ProfitCenter": f"PC_{segments[comp_idx].replace(' ', '_').upper()}",
                "Segment": segments[comp_idx],
                "DocumentDate": (posting_date - timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
            })
            
        return entries

    def _generate_mock_product_inventory(self) -> list:
        materials = [
            ("MAT-1001", "High-Performance Processing Engine A", "DE01", 12000.0, 2500.0),
            ("MAT-1002", "Optic Core Sensor Cluster", "DE01", 8500.0, 1500.0),
            ("MAT-2004", "Quantum Quantum Bus Unit", "US01", 4500.0, 1000.0),
            ("MAT-3009", "Super-Capacitor Module E", "SG01", 16000.0, 3000.0),
            ("MAT-4001", "Graphene Heat Dissipator Shield", "US01", 22000.0, 5000.0),
            ("MAT-5002", "Pneumatic Pressure Actuator X", "SG01", 3100.0, 800.0)
        ]
        vendors = ["Apex Industrial Logistics", "Synapse Component Corp", "Nexus Forge Global", "Prime Graphene Ltd"]

        inventory = []
        for mat_num, desc, plant, base_stock, safety in materials:
            # Add some variability
            stock = round(base_stock * random.uniform(0.6, 1.6), 2)
            sales_order_demand = round(stock * random.uniform(0.1, 0.5), 2)
            fulfillment = random.randint(3, 18)
            vendor = random.choice(vendors)
            score = round(random.uniform(70.0, 100.0), 1)

            inventory.append({
                "Material": mat_num,
                "MaterialDescription": desc,
                "Plant": plant,
                "StockQuantity": stock,
                "SafetyStock": safety,
                "SalesOrderDemand": sales_order_demand,
                "FulfillmentLeadTimeDays": fulfillment,
                "PreferredVendor": vendor,
                "SupplierPerformanceScore": score
            })
        return inventory

    def _generate_mock_bw_query(self, query_name: str) -> dict:
        return {
            "query_name": query_name,
            "system": "SAP BW/4HANA",
            "extracted_at": datetime.utcnow().isoformat(),
            "dimensions": ["CalendarYear", "CalendarMonth", "CompanyCode", "GLAccountGroup"],
            "measures": ["ActualAmount", "BudgetAmount", "VariancePercentage"],
            "results": [
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "01",
                    "CompanyCode": "DE01",
                    "GLAccountGroup": "REVENUE",
                    "ActualAmount": 1240000.0,
                    "BudgetAmount": 1150000.0,
                    "VariancePercentage": 7.8
                },
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "02",
                    "CompanyCode": "DE01",
                    "GLAccountGroup": "REVENUE",
                    "ActualAmount": 1310000.0,
                    "BudgetAmount": 1200000.0,
                    "VariancePercentage": 9.17
                },
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "01",
                    "CompanyCode": "US01",
                    "GLAccountGroup": "REVENUE",
                    "ActualAmount": 2100000.0,
                    "BudgetAmount": 2250000.0,
                    "VariancePercentage": -6.67
                },
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "02",
                    "CompanyCode": "US01",
                    "GLAccountGroup": "REVENUE",
                    "ActualAmount": 2420000.0,
                    "BudgetAmount": 2300000.0,
                    "VariancePercentage": 5.22
                },
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "01",
                    "CompanyCode": "DE01",
                    "GLAccountGroup": "COGS",
                    "ActualAmount": 610000.0,
                    "BudgetAmount": 590000.0,
                    "VariancePercentage": 3.39
                },
                {
                    "CalendarYear": "2026",
                    "CalendarMonth": "02",
                    "CompanyCode": "DE01",
                    "GLAccountGroup": "COGS",
                    "ActualAmount": 630000.0,
                    "BudgetAmount": 610000.0,
                    "VariancePercentage": 3.28
                }
            ]
        }

sap_client = SapClient()
