import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart4,
  RefreshCw,
  Download,
  Layout,
  Lock,
  Compass,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

export const PowerBiEmbed: React.FC = () => {
  const { user } = useAuth();
  const [activeRlsRole, setActiveRlsRole] = useState<string>("Finance_Global");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);

  // High fidelity dataset for Power BI RLS simulation
  const financeData = [
    { category: "Hardware", Revenue: 1850000, COGS: 1100000 },
    { category: "Software Lic.", Revenue: 2450000, COGS: 980000 },
    { category: "SaaS Sub.", Revenue: 3100000, COGS: 1450000 },
    { category: "Consulting", Revenue: 1200000, COGS: 850000 },
  ];

  const logisticsData = [
    { month: "Jan", LeadTime: 12, Demand: 450 },
    { month: "Feb", LeadTime: 10, Demand: 510 },
    { month: "Mar", LeadTime: 14, Demand: 630 },
    { month: "Apr", LeadTime: 15, Demand: 590 },
    { month: "May", LeadTime: 8, Demand: 720 },
  ];

  // Map roles to RLS visibility
  const canSeeFinance =
    activeRlsRole === "Finance_Global" || activeRlsRole === "Admin_All";
  const canSeeLogistics =
    activeRlsRole === "Logistics_Global" || activeRlsRole === "Admin_All";

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const handleExport = () => {
    alert(
      "Power BI Gateway Client: Export process initiated. Transferring secure direct query reports via Azure API standard export stream."
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Power BI Embedded Studio
            <span className="text-xs bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded border border-zinc-700">
              Azure App-Owns-Data
            </span>
          </h2>
          <p className="text-sm text-zinc-400">
            Interactive visualization workspace loading analytical data based on active Row-Level Security (RLS) contexts.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition-all ${
              editMode
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            {editMode ? "Save Customizations" : "Customize Report"}
          </button>
        </div>
      </div>

      {/* RLS Sandbox Configurator Bar */}
      <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Row-Level Security (RLS) Simulation Manager
            </h3>
            <p className="text-[10px] text-zinc-400">
              Select an Active Directory role group token to test database filtering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRlsRole("Finance_Global")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
              activeRlsRole === "Finance_Global"
                ? "bg-zinc-800 text-white border-blue-600"
                : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Finance_Global Group
          </button>
          <button
            onClick={() => setActiveRlsRole("Logistics_Global")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
              activeRlsRole === "Logistics_Global"
                ? "bg-zinc-800 text-white border-blue-600"
                : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Logistics_Global Group
          </button>
          <button
            onClick={() => setActiveRlsRole("Admin_All")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
              activeRlsRole === "Admin_All"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            SuperUser Access
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container Mimicry */}
      <div
        className={`w-full rounded-lg p-6 relative border bg-zinc-950 border-zinc-800`}
      >
        {/* Fake embedded frame header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6 text-xs font-semibold text-zinc-400">
          <span className="flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-blue-500" />
            Power BI Report Workspace Viewport
          </span>
          <span className="flex items-center gap-1.5">
            Active AD Identity:{" "}
            <strong className="text-white">{user?.username}</strong>
          </span>
        </div>

        {/* Refresh Mask */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-zinc-950/90 rounded-lg z-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-zinc-400">
              Validating token parameters...
            </span>
          </div>
        )}

        {/* Widgets Canvas Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          
          {/* Widget 1: Revenue by Category (FINANCE RLS) */}
          {canSeeFinance ? (
            <div
              className={`p-5 rounded-lg border relative bg-zinc-900 border-zinc-800`}
            >
              {editMode && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] cursor-move">
                  DRAG
                </div>
              )}
              <h4
                className={`text-xs font-extrabold uppercase tracking-wider mb-4 text-white`}
              >
                Revenue vs COGS by Business Line (Finance RLS)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />
                    <XAxis dataKey="category" stroke="#71717a" fontSize={10} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickFormatter={(v) => `$${v / 1000000}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="Revenue"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="COGS" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3">
              <Lock className="w-8 h-8 text-rose-450" />
              <div>
                <h4 className="text-xs font-bold text-zinc-300">
                  Data Panel Locked (Row-Level Security)
                </h4>
                <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                  Access to financial datasets is restricted. Select a role mapping with Finance_Global to view.
                </p>
              </div>
            </div>
          )}

          {/* Widget 2: Lead time dynamics (LOGISTICS RLS) */}
          {canSeeLogistics ? (
            <div
              className={`p-5 rounded-lg border relative bg-zinc-900 border-zinc-800`}
            >
              {editMode && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] cursor-move">
                  DRAG
                </div>
              )}
              <h4
                className={`text-xs font-extrabold uppercase tracking-wider mb-4 text-white`}
              >
                Fulfillment Lead Times &amp; Demand Velocity (Logistics RLS)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logisticsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#71717a" fontSize={10} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#71717a"
                      fontSize={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="LeadTime"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Lead Time (Days)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Demand"
                      stroke="#64748b"
                      strokeWidth={2}
                      name="Sales Demand"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3">
              <Lock className="w-8 h-8 text-rose-455" />
              <div>
                <h4 className="text-xs font-bold text-zinc-300">
                  Data Panel Locked (Row-Level Security)
                </h4>
                <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                  Access to inventory datasets is restricted. Select a role mapping with Logistics_Global to view.
                </p>
              </div>
            </div>
          )}

          {/* Widget 3: General ledger status */}
          <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
                <Compass className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  Secure Direct-Query OData Gateway
                </h5>
                <p className="text-[10px] text-zinc-400">
                  Gateway query routing endpoints mapped through SAP S/4HANA OData Core.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-md leading-relaxed max-w-md">
              <strong>Azure Gateway Active</strong>: Direct connection mapped for dataset <code>ds-sap-olap-cube-01</code>. RLS filtering policies mapped to local session cookies.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
