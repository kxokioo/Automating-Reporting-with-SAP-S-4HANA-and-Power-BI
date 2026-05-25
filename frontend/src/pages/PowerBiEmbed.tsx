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
  const [reportTheme] = useState<"Dark" | "Light">("Dark");
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
      "Power BI Client SDK: Compiling report layout variables. Initiating secure PDF/Excel export stream via Azure Power BI ExportTo API...",
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Power BI Embedded Studio{" "}
            <span className="text-xs bg-[#f2c811]/20 text-[#f2c811] font-bold px-2 py-0.5 rounded border border-[#f2c811]/40">
              Azure App-Owns-Data
            </span>
          </h2>
          <p className="text-sm text-slate-400">
            High-fidelity interactive embedding panel rendering Row-Level
            Security (RLS) contexts.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              editMode
                ? "bg-darkspace-glowViolet text-white border-darkspace-glowViolet shadow-md"
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            {editMode ? "Publish Layout" : "Customize Report"}
          </button>
        </div>
      </div>

      {/* RLS Sandbox Configurator Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-indigo-950">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Embedded Row-Level Security (RLS) Simulator
            </h3>
            <p className="text-[10px] text-slate-400">
              Inspect how report elements filter depending on the target AD
              security group token.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRlsRole("Finance_Global")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeRlsRole === "Finance_Global"
                ? "bg-indigo-950 text-indigo-300 border-indigo-500/50"
                : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            📊 Finance_Global Group
          </button>
          <button
            onClick={() => setActiveRlsRole("Logistics_Global")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeRlsRole === "Logistics_Global"
                ? "bg-indigo-950 text-indigo-300 border-indigo-500/50"
                : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            🚚 Logistics_Global Group
          </button>
          <button
            onClick={() => setActiveRlsRole("Admin_All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeRlsRole === "Admin_All"
                ? "bg-gradient-to-tr from-darkspace-glowViolet to-darkspace-glowIndigo text-white border-darkspace-glowViolet shadow-md shadow-indigo-950/30"
                : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            👑 SuperUser (No Filters)
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container Mimicry */}
      <div
        className={`w-full rounded-2xl p-6 shadow-2xl relative border ${
          reportTheme === "Dark"
            ? "bg-[#060321]/90 border-white/5"
            : "bg-slate-50 border-slate-200 text-slate-900"
        }`}
      >
        {/* Fake embedded frame header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-[#f2c811]" />
            Power BI Report Service Embedded Frame
          </span>
          <span className="flex items-center gap-1.5">
            Active AD Identity:{" "}
            <strong className="text-white">{user?.username}</strong>
          </span>
        </div>

        {/* Refresh Mask */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-[#060321]/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#f2c811] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-300 animate-pulse">
              Requesting direct Azure AD token cache...
            </span>
          </div>
        )}

        {/* Widgets Canvas Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          {/* Widget 1: Revenue by Category (FINANCE RLS) */}
          {canSeeFinance ? (
            <div
              className={`p-5 rounded-xl border relative ${
                reportTheme === "Dark"
                  ? "bg-[#0d092d]/50 border-white/5"
                  : "bg-white border-slate-200"
              }`}
            >
              {editMode && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-darkspace-glowViolet text-white font-extrabold text-[9px] cursor-move">
                  DRAG
                </div>
              )}
              <h4
                className={`text-xs font-extrabold uppercase tracking-wider mb-4 ${reportTheme === "Dark" ? "text-white" : "text-slate-900"}`}
              >
                📊 Revenue vs COGS by Business Line (Finance RLS)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        reportTheme === "Dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)"
                      }
                    />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={(v) => `$${v / 1000000}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070420",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="Revenue"
                      fill="#7f00ff"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="COGS" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="border border-white/5 bg-[#0a0724]/40 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
              <Lock className="w-8 h-8 text-rose-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-300">
                  Section Locked (Row-Level Security)
                </h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  This segment requires member clearance of active Azure AD role
                  groups: 'Finance_Global'.
                </p>
              </div>
            </div>
          )}

          {/* Widget 2: Lead time dynamics (LOGISTICS RLS) */}
          {canSeeLogistics ? (
            <div
              className={`p-5 rounded-xl border relative ${
                reportTheme === "Dark"
                  ? "bg-[#0d092d]/50 border-white/5"
                  : "bg-white border-slate-200"
              }`}
            >
              {editMode && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-darkspace-glowViolet text-white font-extrabold text-[9px] cursor-move">
                  DRAG
                </div>
              )}
              <h4
                className={`text-xs font-extrabold uppercase tracking-wider mb-4 ${reportTheme === "Dark" ? "text-white" : "text-slate-900"}`}
              >
                🚚 Fulfillment Lead Times & Demand Velocity (Logistics RLS)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logisticsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        reportTheme === "Dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)"
                      }
                    />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#94a3b8"
                      fontSize={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070420",
                        border: "none",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="LeadTime"
                      stroke="#00f2fe"
                      strokeWidth={2}
                      name="Lead Time (Days)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Demand"
                      stroke="#f2c811"
                      strokeWidth={2}
                      name="Sales Demand"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="border border-white/5 bg-[#0a0724]/40 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
              <Lock className="w-8 h-8 text-rose-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-300">
                  Section Locked (Row-Level Security)
                </h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">
                  This segment requires member clearance of active Azure AD role
                  groups: 'Logistics_Global'.
                </p>
              </div>
            </div>
          )}

          {/* Widget 3: General ledger status */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f2c811]/10 flex items-center justify-center border border-[#f2c811]/20">
                <Compass className="w-5 h-5 text-[#f2c811]" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  Secure Direct-Query OData Gateway
                </h5>
                <p className="text-[10px] text-slate-400">
                  Currently routing queries directly through SAP S/4HANA OData
                  Core gateway.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-lg leading-relaxed max-w-md">
              🌐 <strong>Azure Gateway Connect</strong>: Successfully mapped
              metadata structures for datasets <code>ds-sap-olap-cube-01</code>.
              SSL Certificate validated. RLS policies successfully initialized
              in memory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
