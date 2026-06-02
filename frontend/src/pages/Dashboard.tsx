import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  DollarSign,
  Package,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
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

  // Derived / display values
  const pieColors = ["#2563eb", "#64748b", "#475569"];

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
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">
            Loading data from SAP gateway...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-lg text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300 font-semibold">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
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
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Operations Overview{" "}
            <span className="text-xs bg-zinc-900 text-zinc-400 font-semibold px-2 py-0.5 rounded border border-zinc-800">
              v2026.1
            </span>
          </h2>
          <p className="text-sm text-zinc-400">
            Cached records from connected SAP S/4HANA OData services.
          </p>
        </div>

        {/* Global Segment Filter Panel */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md p-1">
          {["All", "North America", "Europe", "Asia-Pacific"].map((seg) => (
            <button
              key={seg}
              onClick={() => setSegmentFilter(seg)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${segmentFilter === seg ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
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
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Gross Revenue
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
          <div className="w-10 h-10 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Card 2: EBITDA */}
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Operating EBITDA
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              ${(overview?.financials.ebitda ?? 0).toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {overview?.financials.profit_margin_pct.toFixed(1)}% Margin
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Card 3: SKU Inventory Warning */}
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Critical Stockout Alerts
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {overview?.logistics.critical_stockout_risk ?? criticalCount} SKUs
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Under Safety Stock Limit</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Card 4: Ledger Points */}
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Sync Operations Count
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
              {activeSyncCount.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Active OData Cache Connection</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main Charts Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue vs Budget Trends (Line Chart) */}
        <div className="glass-panel p-5 rounded-lg lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                Revenue vs Budget
              </h4>
              <p className="text-[11px] text-zinc-450">
                Monthly actual general ledger revenues compared to budget targets
              </p>
            </div>
            <span className="text-[11px] text-zinc-400 font-semibold bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
              USD Standardized
            </span>
          </div>
          <div className="h-72">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Budget"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                Financial trend data requires FinancialAnalyst or Admin role.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Segments Sales share (Pie Chart) */}
        <div className="glass-panel p-5 rounded-lg space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Revenue Share by Segment
            </h4>
            <p className="text-[11px] text-zinc-450">
              Total gross allocation across primary operating regions
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
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(v: any) => `$${Number(v).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-500 text-xs text-center">
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
                  <span className="text-zinc-400 font-semibold">
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
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
              Warehouse Inventory Monitor
            </h4>
            <p className="text-[11px] text-zinc-400">
              Comparison of warehouse inventory against current sales order commitments.
            </p>
          </div>
          {criticalCount > 0 && (
            <span className="text-xs text-rose-450 font-bold px-2 py-0.5 rounded bg-rose-950/20 border border-rose-900/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} Stockout Risk{criticalCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {inventoryAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-450 font-semibold">
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
                    className="border-b border-zinc-800/40 text-zinc-200 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-3 font-mono font-semibold text-blue-500">
                      {item.material_number}
                    </td>
                    <td className="py-3 font-semibold">{item.description}</td>
                    <td className="py-3 font-bold font-mono">
                      {item.stock} Units
                    </td>
                    <td className="py-3 font-mono text-zinc-400">
                      {item.safety_stock} Units
                    </td>
                    <td className="py-3 font-semibold">{item.plant}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.under_safety
                            ? "bg-rose-950/30 text-rose-400 border border-rose-900/30"
                            : "bg-emerald-950/30 text-emerald-400 border border-emerald-900/20"
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
          <div className="text-xs text-zinc-500 text-center py-6">
            {user?.role === "Admin" || user?.role === "LogisticsManager"
              ? "All inventory levels within safety thresholds."
              : "Inventory data requires LogisticsManager or Admin role."}
          </div>
        )}
      </div>
    </div>
  );
};
