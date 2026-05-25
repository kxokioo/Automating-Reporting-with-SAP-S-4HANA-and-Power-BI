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
    "API_JOURNALENTRY_SRV",
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

    // Simulate query time
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
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          SAP Integration Explorer{" "}
          <span className="text-xs bg-indigo-950 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-800">
            OData Core
          </span>
        </h2>
        <p className="text-sm text-slate-400">
          Directly query and inspect SAP S/4HANA OData schemas and relational
          database tables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: SAP Schema Tree explorer */}
        <div className="glass-panel p-5 rounded-xl space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Database className="w-5 h-5 text-darkspace-glowViolet" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              SAP Table Registry
            </h3>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px]">
            {Object.values(sapTables).map((table) => {
              const isExpanded = expandedTable === table.name;
              return (
                <div
                  key={table.name}
                  className="border border-white/5 rounded-lg overflow-hidden bg-black/10"
                >
                  <button
                    onClick={() =>
                      setExpandedTable(isExpanded ? null : table.name)
                    }
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <span className="text-xs font-extrabold text-indigo-300 font-mono">
                        {table.name}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]">
                        {table.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-90 text-darkspace-glowViolet" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-3 bg-black/30 border-t border-white/5 space-y-2">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Metadata Columns
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {table.columns.map((col) => (
                          <div
                            key={col}
                            className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300"
                          >
                            <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
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
          <div className="glass-panel p-5 rounded-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Network className="w-5 h-5 text-darkspace-glowTeal" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                OData Request Builder
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  SAP Service Gateway
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setSelectedEntity(
                      e.target.value === "API_JOURNALENTRY_SRV"
                        ? "A_JournalEntry"
                        : "A_Product",
                    );
                  }}
                  className="w-full bg-[#070420] text-xs font-semibold text-slate-200 border border-white/10 rounded-lg p-2.5 outline-none focus:border-darkspace-glowTeal cursor-pointer"
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Entity Set
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full bg-[#070420] text-xs font-semibold text-slate-200 border border-white/10 rounded-lg p-2.5 outline-none focus:border-darkspace-glowTeal cursor-pointer"
                >
                  {selectedService === "API_JOURNALENTRY_SRV" ? (
                    <option value="A_JournalEntry">A_JournalEntry</option>
                  ) : (
                    <option value="A_Product">A_Product</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Top Count ($top)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={topCount}
                  onChange={(e) => setTopCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#070420] text-xs font-semibold text-slate-200 border border-white/10 rounded-lg p-2.5 outline-none focus:border-darkspace-glowTeal"
                />
              </div>
            </div>

            {/* URL Display */}
            <div className="bg-[#040114]/80 border border-white/5 rounded-lg p-3 font-mono text-[10px] text-indigo-300 flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-x-auto">
              <span className="truncate">
                GET https://mock.sap-s4hana.aetheris.com:8443/sap/opu/odata/sap/
                {selectedService}/{selectedEntity}?$top={topCount}&$format=json
              </span>
              <button
                onClick={handleSendOdata}
                disabled={isQuerying}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950 to-indigo-800 hover:brightness-110 text-white font-bold px-3 py-1.5 rounded-lg border border-indigo-700 transition-all self-end md:self-auto flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Query OData
              </button>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="glass-panel p-5 rounded-xl shadow-xl space-y-4 h-96 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  OData Gateway Output Payload
                </span>
              </div>
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-indigo-300">
                APPLICATION_JSON
              </span>
            </div>

            <div className="flex-1 bg-[#040114]/60 border border-white/5 rounded-lg p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto leading-relaxed shadow-inner select-text">
              {isQuerying ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                  <div className="w-6 h-6 border-2 border-darkspace-glowTeal border-t-transparent rounded-full animate-spin"></div>
                  <div className="animate-pulse">
                    Retrieving multi-dimensional relational segments from SAP
                    staging catalog...
                  </div>
                </div>
              ) : jsonResponse ? (
                <pre>{JSON.stringify(jsonResponse, null, 2)}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                  <HelpCircle className="w-10 h-10 text-slate-700" />
                  <div className="text-xs font-semibold">
                    OData Sandbox Idle.
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-sm text-center">
                    Construct a query path using the builder inputs above and
                    hit "Query OData" to query.
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
