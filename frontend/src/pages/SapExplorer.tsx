import React, { useState } from "react";
import {
  Database,
  Terminal,
  Send,
  ChevronRight,
  FileCode,
  Network,
  HelpCircle,
} from "lucide-react";

interface SchemaNode {
  name: string;
  description: string;
  columns: string[];
}

export const SapExplorer: React.FC = () => {
  const [selectedEntity, setSelectedEntity] =
    useState<string>("A_JournalEntry");
  const [selectedService, setSelectedService] = useState<string>(
    "API_JOURNALENTRY_SRV"
  );
  const [topCount, setTopCount] = useState<number>(3);
  const [jsonResponse, setJsonResponse] = useState<any | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [expandedTable, setExpandedTable] = useState<string | null>("BKPF");

  const sapTables: Record<string, SchemaNode> = {
    BKPF: {
      name: "BKPF",
      description: "Accounting Document Header",
      columns: [
        "MANDT (Client Key)",
        "BUKRS (Company Code)",
        "BELNR (Accounting Document ID)",
        "GJAHR (Fiscal Year)",
        "BLART (Document Type)",
        "BUDAT (Posting Date)",
      ],
    },
    BSEG: {
      name: "BSEG",
      description: "Accounting Document Segment (Line Items)",
      columns: [
        "BUKRS (Company Code)",
        "BELNR (Accounting Document ID)",
        "BUZEI (Line Item Index)",
        "HKONT (GL Account Number)",
        "WRBTR (Amount in Transaction)",
        "SHKZG (Debit/Credit Indicator)",
      ],
    },
    MARA: {
      name: "MARA",
      description: "General Material Data",
      columns: [
        "MATNR (Material ID)",
        "ERSDA (Creation Date)",
        "ERNAM (Created By)",
        "MTART (Material Type)",
        "MEINS (Base Unit of Measure)",
      ],
    },
    VBAK: {
      name: "VBAK",
      description: "Sales Document Header Data",
      columns: [
        "VBELN (Sales Order ID)",
        "ERDAT (Creation Date)",
        "ERNAM (Created By)",
        "NETWR (Net Value in Contract)",
        "WAERK (Transaction Currency)",
      ],
    },
  };

  const handleSendOdata = () => {
    setIsQuerying(true);
    setJsonResponse(null);

    // Simulate query connection latency
    setTimeout(() => {
      if (selectedService === "API_JOURNALENTRY_SRV") {
        const journalMock = [
          {
            __metadata: {
              id: "A_JournalEntry('10000100')",
              type: "API_JOURNALENTRY_SRV.A_JournalEntry",
            },
            CompanyCode: "US01",
            AccountingDocument: "10000100",
            PostingDate: "2026-05-24T12:00:00Z",
            GLAccount: "400000",
            GLAccountName: "Revenue - Product Sales",
            AmountInTransactionCurrency: -25000.0,
            TransactionCurrency: "USD",
            Segment: "North America",
          },
          {
            __metadata: {
              id: "A_JournalEntry('10000101')",
              type: "API_JOURNALENTRY_SRV.A_JournalEntry",
            },
            CompanyCode: "DE01",
            AccountingDocument: "10000101",
            PostingDate: "2026-05-24T14:15:00Z",
            GLAccount: "500000",
            GLAccountName: "Cost of Goods Sold (COGS)",
            AmountInTransactionCurrency: 18200.0,
            TransactionCurrency: "EUR",
            Segment: "Europe",
          },
          {
            __metadata: {
              id: "A_JournalEntry('10000102')",
              type: "API_JOURNALENTRY_SRV.A_JournalEntry",
            },
            CompanyCode: "SG01",
            AccountingDocument: "10000102",
            PostingDate: "2026-05-24T16:40:00Z",
            GLAccount: "600000",
            GLAccountName: "Operating Expenses - Salaries",
            AmountInTransactionCurrency: 14500.0,
            TransactionCurrency: "SGD",
            Segment: "Asia-Pacific",
          },
        ];
        setJsonResponse({
          d: {
            results: journalMock.slice(0, topCount),
          },
        });
      } else {
        const inventoryMock = [
          {
            __metadata: {
              id: "A_Product('MAT-1001')",
              type: "API_PRODUCT_SRV.A_Product",
            },
            Material: "MAT-1001",
            MaterialDescription: "Optic Core Sensor Cluster",
            Plant: "DE01",
            StockQuantity: 12000.0,
            SafetyStock: 500.0,
            SalesOrderDemand: 1450.0,
            FulfillmentLeadTimeDays: 12,
            PreferredVendor: "Apex Industrial Logistics",
          },
          {
            __metadata: {
              id: "A_Product('MAT-2004')",
              type: "API_PRODUCT_SRV.A_Product",
            },
            Material: "MAT-2004",
            MaterialDescription: "Quantum Bus Interface Module",
            Plant: "US01",
            StockQuantity: 45.0,
            SafetyStock: 150.0,
            SalesOrderDemand: 85.0,
            FulfillmentLeadTimeDays: 18,
            PreferredVendor: "Nexus Forge Global",
          },
        ];
        setJsonResponse({
          d: {
            results: inventoryMock.slice(0, topCount),
          },
        });
      }
      setIsQuerying(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          SAP Integration Explorer
          <span className="text-xs bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded border border-zinc-700">
            OData Gateway
          </span>
        </h2>
        <p className="text-sm text-zinc-400">
          Query metadata structures from connected SAP S/4HANA instances.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: SAP Schema Tree explorer */}
        <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4 flex flex-col">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              SAP Schema Tables
            </h3>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px]">
            {Object.values(sapTables).map((table) => {
              const isExpanded = expandedTable === table.name;
              return (
                <div
                  key={table.name}
                  className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-950/20"
                >
                  <button
                    onClick={() =>
                      setExpandedTable(isExpanded ? null : table.name)
                    }
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-800/30 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-zinc-350 font-mono">
                        {table.name}
                      </span>
                      <p className="text-[10px] text-zinc-400 font-semibold truncate max-w-[200px]">
                        {table.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-90 text-blue-500" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-zinc-950/40 border-t border-zinc-800 space-y-2">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        Table Columns
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {table.columns.map((col) => (
                          <div
                            key={col}
                            className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-300"
                          >
                            <FileCode className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <span>{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive OData Client sandbox */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Network className="w-5 h-5 text-blue-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                OData Query Builder
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  SAP Gateway Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setSelectedEntity(
                      e.target.value === "API_JOURNALENTRY_SRV"
                        ? "A_JournalEntry"
                        : "A_Product"
                    );
                  }}
                  className="w-full bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-800 rounded-md p-2.5 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="API_JOURNALENTRY_SRV">
                    API_JOURNALENTRY_SRV (Finance)
                  </option>
                  <option value="API_PRODUCT_SRV">
                    API_PRODUCT_SRV (Logistics)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Target Entity Set
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-800 rounded-md p-2.5 outline-none focus:border-blue-600 cursor-pointer"
                >
                  {selectedService === "API_JOURNALENTRY_SRV" ? (
                    <option value="A_JournalEntry">A_JournalEntry</option>
                  ) : (
                    <option value="A_Product">A_Product</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Records Limit ($top)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={topCount}
                  onChange={(e) => setTopCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-800 rounded-md p-2.5 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* URL Display */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3 font-mono text-[10px] text-zinc-300 flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-x-auto">
              <span className="truncate pr-4 text-zinc-400">
                GET https://mock.sap-s4hana.aetheris.com:8443/sap/opu/odata/sap/
                {selectedService}/{selectedEntity}?$top={topCount}&$format=json
              </span>
              <button
                onClick={handleSendOdata}
                disabled={isQuerying}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 font-semibold px-3.5 py-1.5 rounded-md text-xs transition-all self-end md:self-auto flex-shrink-0 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Query API
              </button>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4 h-96 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  OData Response Payload
                </span>
              </div>
              <span className="text-[9px] font-semibold bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-350">
                application/json
              </span>
            </div>

            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto leading-relaxed shadow-inner select-text">
              {isQuerying ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-550 gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs">
                    Connecting to SAP database instance...
                  </div>
                </div>
              ) : jsonResponse ? (
                <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 text-center">
                  <HelpCircle className="w-8 h-8 text-zinc-700" />
                  <div className="text-xs font-bold text-zinc-400">
                    OData Explorer Idle
                  </div>
                  <div className="text-[10px] text-zinc-500 max-w-xs leading-normal">
                    Select a service entity set and click "Query API" to inspect gateway database structures in real-time.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
