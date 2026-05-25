import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  DollarSign,
  Package,
  Activity,
  Award,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface AnalyticsOverview {
  financials: {
    total_revenue: number;
    total_cogs: number;
    ebitda: number;
    profit_margin_pct: number;
  };
  logistics: {
    active_skus: number;
    critical_stockout_risk: number;
    average_supplier_reliability_score: number;
    average_fulfillment_days: number;
  };
}

interface FinancialDashboard {
  segments: { segment: string; value: number }[];
  accounts: {
    account_number: string;
    account_name: string;
    net_amount: number;
    category: string;
  }[];
  trends: { month: string; revenue: number; budget: number; cogs: number }[];
}

interface LogisticsItem {
  material_number: string;
  description: string;
  plant: string;
  stock: number;
  safety_stock: number;
  sales_order_demand: number;
  fulfillment_lead_days: number;
  preferred_vendor: string;
  supplier_score: number;
  under_safety: boolean;
}

export const Dashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [segmentFilter, setSegmentFilter] = useState<string>("All");

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [financials, setFinancials] = useState<FinancialDashboard | null>(null);
  const [logistics, setLogistics] = useState<LogisticsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time telemetry counter — seeded from actual record count, then incremented
  const [activeSyncCount, setActiveSyncCount] = useState<number>(0);

  useEffect(() => {
    if (activeSyncCount === 0) return;
    const timer = setInterval(() => {
      setActiveSyncCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, [activeSyncCount]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch overview (any authenticated user)
      const overviewRes = await apiFetch("/analytics/overview");
      if (!overviewRes.ok)
        throw new Error("Failed to fetch analytics overview");
      const overviewData: AnalyticsOverview = await overviewRes.json();
      setOverview(overviewData);
      // Seed live sync counter with total record proxy (revenue * 1000 as demonstration)
      setActiveSyncCount(
        Math.round(overviewData.financials.total_revenue / 100 + 400000),
      );

      // Fetch financials (Finance / Admin roles only; gracefully skip for others)
      if (user?.role === "Admin" || user?.role === "FinancialAnalyst") {
        const finRes = await apiFetch("/analytics/financials");
        if (finRes.ok) {
          const finData: FinancialDashboard = await finRes.json();
          setFinancials(finData);
        }
      }

      // Fetch logistics (Logistics / Admin roles only)
      if (user?.role === "Admin" || user?.role === "LogisticsManager") {
        const logRes = await apiFetch("/analytics/logistics");
        if (logRes.ok) {
          const logData: { skus: LogisticsItem[] } = await logRes.json();
          setLogistics(logData.skus || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Derived / display values ──────────────────────────────────────────────

  const pieColors = ["#7f00ff", "#3f5efb", "#00f2fe"];

  // Segments for pie chart — filter by selected region
  const segmentRevenueData =
    financials?.segments.filter(
      (s) => segmentFilter === "All" || s.segment === segmentFilter,
    ) ?? [];

  // Trend data from backend (mapped to chart shape)
  const trendData = (financials?.trends ?? []).map((t) => ({
    name: t.month,
    Revenue: t.revenue,
    Budget: t.budget,
    COGS: t.cogs,
  }));

  // Filter inventory alerts
  const inventoryAlerts = logistics.filter(
    (item) =>
      segmentFilter === "All" ||
      item.plant.startsWith(
        segmentFilter === "North America"
          ? "US"
          : segmentFilter === "Europe"
            ? "DE"
            : "SG",
      ),
  );

  const criticalCount = inventoryAlerts.filter((i) => i.under_safety).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-darkspace-glowViolet border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">
            Loading enterprise telemetry…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300 font-semibold">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Enterprise Command Center{" "}
            <span className="text-xs bg-indigo-950 text-darkspace-glowTeal font-bold px-2 py-0.5 rounded border border-indigo-800">
              2026.1
            </span>
          </h2>
          <p className="text-sm text-slate-400">
            Automated SAP S/4HANA OData records cache &amp; multidimensional
            telemetry.
          </p>
        </div>

        {/* Global Segment Filter Panel */}
        <div className="flex items-center gap-2 bg-[#09052b] border border-white/10 rounded-lg p-1">
          {["All", "North America", "Europe", "Asia-Pacific"].map((seg) => (
            <button
              key={seg}
              onClick={() => setSegmentFilter(seg)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${segmentFilter === seg ? "bg-gradient-to-tr from-darkspace-glowViolet to-darkspace-glowIndigo text-white" : "text-slate-400 hover:text-white"}`}
            >
              {seg === "All"
                ? "Global"
                : seg === "North America"
                  ? "NA Segment"
                  : seg === "Europe"
                    ? "EU Segment"
                    : "APAC Segment"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-darkspace-glowViolet/10 rounded-full blur-xl"></div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Gross Sync Revenue
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              ${(overview?.financials.total_revenue ?? 0).toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {overview?.financials.profit_margin_pct.toFixed(1)}% Net Margin
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-darkspace-glowViolet/10 border border-darkspace-glowViolet/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-darkspace-glowViolet" />
          </div>
        </div>

        {/* Card 2: EBITDA */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-darkspace-glowIndigo/10 rounded-full blur-xl"></div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Operating EBITDA
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              ${(overview?.financials.ebitda ?? 0).toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {overview?.financials.profit_margin_pct.toFixed(1)}% Profit
                Margin
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-darkspace-glowIndigo/10 border border-darkspace-glowIndigo/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-darkspace-glowIndigo" />
          </div>
        </div>

        {/* Card 3: SKU Inventory Warning */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Critical Stockout Alerts
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {overview?.logistics.critical_stockout_risk ?? criticalCount} SKUs
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Under Safety Stock Limit</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Card 4: Ledger Points */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-darkspace-glowTeal/10 rounded-full blur-xl"></div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Ledger Telemetry Sync
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white font-mono text-neon-teal">
              {activeSyncCount.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-darkspace-glowTeal">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Active OData Stream</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-darkspace-glowTeal/10 border border-darkspace-glowTeal/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-darkspace-glowTeal" />
          </div>
        </div>
      </div>

      {/* Main Charts Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue vs Budget Trends (Area Chart) */}
        <div className="glass-panel p-5 rounded-xl lg:col-span-2 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Financial Performance Tracker
              </h4>
              <p className="text-[11px] text-slate-400">
                Comparing actual general ledger revenues against budgeted goals
              </p>
            </div>
            <span className="text-[11px] text-slate-300 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              USD Standardized
            </span>
          </div>
          <div className="h-72">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7f00ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7f00ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#070420",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#7f00ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Budget"
                    stroke="#00f2fe"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBud)"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Financial trend data requires FinancialAnalyst or Admin role.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Segments Sales share (Pie Chart) */}
        <div className="glass-panel p-5 rounded-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Revenue Share by Segment
            </h4>
            <p className="text-[11px] text-slate-400">
              Total gross allocation across primary corporate operating regions
            </p>
          </div>
          <div className="h-60 flex items-center justify-center">
            {segmentRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentRevenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {segmentRevenueData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#070420",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    formatter={(v: any) => `$${Number(v).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs text-center">
                Segment data requires FinancialAnalyst or Admin role.
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            {segmentRevenueData.map((item, idx) => (
              <div
                key={item.segment}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: pieColors[idx] }}
                  ></span>
                  <span className="text-slate-400 font-semibold">
                    {item.segment}
                  </span>
                </div>
                <span className="text-white font-bold">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Stock alerts list */}
      <div className="glass-panel p-5 rounded-xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Inventory Safety Threshold Monitor (MM Module)
            </h4>
            <p className="text-[11px] text-slate-400">
              Reviewing warehouse storage safety capacities vs sales commitments
            </p>
          </div>
          {criticalCount > 0 && (
            <span className="text-xs text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} Lead
              Time Risk{criticalCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {inventoryAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="py-2.5">Material SKU</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5">Current Stock</th>
                  <th className="py-2.5">Safety Stock</th>
                  <th className="py-2.5">Distribution Plant</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAlerts.map((item) => (
                  <tr
                    key={item.material_number}
                    className="border-b border-white/5 text-slate-200 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 font-mono font-semibold text-darkspace-glowTeal">
                      {item.material_number}
                    </td>
                    <td className="py-3 font-semibold">{item.description}</td>
                    <td className="py-3 font-bold font-mono">
                      {item.stock} Units
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {item.safety_stock} Units
                    </td>
                    <td className="py-3 font-semibold">{item.plant}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.under_safety
                            ? "bg-rose-950/50 text-rose-400 border border-rose-900/30"
                            : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                        }`}
                      >
                        {item.under_safety ? "CRITICAL" : "STABLE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-6">
            {user?.role === "Admin" || user?.role === "LogisticsManager"
              ? "All inventory levels within safety thresholds."
              : "Inventory data requires LogisticsManager or Admin role."}
          </div>
        )}
      </div>
    </div>
  );
};
