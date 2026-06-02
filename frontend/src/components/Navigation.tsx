import React from "react";
import { useAuth, UserRole } from "../context/AuthContext";
import {
  LayoutDashboard,
  GitFork,
  Database,
  BarChart4,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { user, logout, switchRole } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Overview Board", icon: LayoutDashboard },
    { id: "etl", label: "ETL Pipelines", icon: GitFork },
    { id: "sap", label: "SAP OData Sandbox", icon: Database },
    { id: "powerbi", label: "Power BI Embedded", icon: BarChart4 },
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div>
        {/* Clean Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart4 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">
              AETHERIS
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase">
              SAP + BI GATEWAY
            </p>
          </div>
        </div>

        {/* User Identity Context Card */}
        {user && (
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                Active Identity
              </span>
            </div>
            <p className="text-sm font-semibold text-white truncate">
              {user.username}
            </p>
            <div className="mt-2 relative">
              <select
                value={user.role}
                onChange={handleRoleChange}
                className="w-full bg-zinc-950 text-[12px] text-zinc-300 font-semibold border border-zinc-800 rounded-md px-2 py-1 outline-none cursor-pointer focus:border-blue-600 transition-all"
              >
                <option value="Admin">Admin (SuperUser)</option>
                <option value="FinancialAnalyst">Financial Analyst</option>
                <option value="LogisticsManager">Logistics Manager</option>
                <option value="Viewer">General Viewer</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-zinc-800 text-white border-l-4 border-blue-600"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-blue-500" : ""}`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/40 hover:border-rose-500/50 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
