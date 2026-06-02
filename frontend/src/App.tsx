import React, { useState } from "react";
import { AuthProvider, useAuth, UserRole } from "./context/AuthContext";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./pages/Dashboard";
import { EtlOrchestrator } from "./pages/EtlOrchestrator";
import { SapExplorer } from "./pages/SapExplorer";
import { PowerBiEmbed } from "./pages/PowerBiEmbed";
import {
  Lock,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

const MainAppContent: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Login form state
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] =
    useState<boolean>(false);

  const submitCredentials = async (userVal: string, passVal: string) => {
    setIsSubmitting(true);
    setLoginError(null);

    // Validate inputs
    if (!userVal.trim()) {
      setLoginError("Username is required");
      setIsSubmitting(false);
      return;
    }
    if (!passVal) {
      setLoginError("Password is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

      const formData = new URLSearchParams();
      formData.append("username", userVal);
      formData.append("password", passVal);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLoginError("Wrong username or password");
        } else if (response.status === 429) {
          setLoginError(
            "Too many login attempts. Please try again in 15 minutes.",
          );
        } else {
          setLoginError(
            `Authentication failed (HTTP ${response.status}). Please try again.`,
          );
        }
        return;
      }

      const data = await response.json();
      login(data.username, data.role as UserRole, data.access_token);

      // Clear form on successful login
      setUsernameInput("");
      setPasswordInput("");
    } catch (err: any) {
      setLoginError(
        err.message ||
          "Unable to connect to gateway services. Please check your network connection.",
      );
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCredentials(usernameInput, passwordInput);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Initializing Gateway Session...
        </p>
      </div>
    );
  }

  // Render Redesigned Landing Page & Login Sheet if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Top Header Navigation */}
        <header className="w-full border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded">A</div>
              <span className="text-lg font-bold text-white tracking-tight">Aetheris Analytics</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center text-xs font-medium text-zinc-400">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                System Status: Active
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Product Information & Proof */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                  Enterprise Data Integration
                </span>
                <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                  SAP and Power BI Integration Platform
                </h1>
                <p className="text-base text-zinc-300 leading-relaxed max-w-xl">
                  Aetheris connects SAP ERP databases and analytical queries directly to Power BI reports. The platform coordinates secure general ledger synchronization and tracks inventory levels, providing real-time operational data without third-party middleware.
                </p>
              </div>

              {/* Proof & Metrics Grid */}
              <div className="space-y-4 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  System Capabilities &amp; Performance
                </h2>
                <div className="grid grid-cols-2 gap-6 max-w-lg">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">4.2M+</div>
                    <div className="text-xs text-zinc-400 leading-normal">Daily Transactions Synchronized</div>
                  </div>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">1.4s</div>
                    <div className="text-xs text-zinc-400 leading-normal">Average Query Latency</div>
                  </div>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">99.8%</div>
                    <div className="text-xs text-zinc-400 leading-normal">Sync Reliability Score</div>
                  </div>
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <div className="text-2xl font-bold text-white">Direct</div>
                    <div className="text-xs text-zinc-400 leading-normal">SAP OData Connectivity</div>
                  </div>
                </div>
              </div>

              {/* Concrete Outcome */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg max-w-xl">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  <strong>Outcome:</strong> A manufacturing partner reduced month-end financial reconciliation times by 40% using Aetheris general ledger automation.
                </p>
              </div>
            </div>

            {/* Right Column: Flat Sign In Form */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-zinc-900 p-8 rounded-lg border border-zinc-800 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Sign In</h2>
                  <p className="text-xs text-zinc-400">
                    Enter your credentials to access the enterprise gateway
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-md bg-rose-950/40 border border-rose-900/30 text-xs text-rose-300 font-semibold flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all disabled:opacity-50"
                        placeholder="Enter username"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all disabled:opacity-50"
                        placeholder="Enter password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-350 transition-colors"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-500 transition-colors font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Authenticating..." : "Authenticate"}
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Demo Credentials Info */}
                <div className="pt-4 border-t border-zinc-800 space-y-2.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Demo Credentials — click any card to fill
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Admin",         user: "admin",     pass: "admin123"     },
                      { label: "Finance Analyst", user: "finance",   pass: "finance123"   },
                      { label: "Logistics Mgr",  user: "logistics", pass: "logistics123" },
                      { label: "Viewer",         user: "viewer",    pass: "viewer123"    },
                    ].map(({ label, user, pass }) => (
                      <button
                        key={user}
                        type="button"
                        onClick={() => { setUsernameInput(user); setPasswordInput(pass); }}
                        className="bg-zinc-800 border border-zinc-600 shadow-sm hover:bg-blue-600 hover:border-blue-500 active:scale-[0.97] p-3 rounded-lg text-left transition-all duration-150 cursor-pointer group"
                      >
                        <div className="text-[11px] font-semibold text-zinc-300 group-hover:text-white uppercase tracking-wide transition-colors">
                          {label}
                        </div>
                        <div className="text-xs text-zinc-400 group-hover:text-blue-100 font-mono mt-1 transition-colors">
                          {user} / {pass}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Footer Area */}
        <footer className="w-full border-t border-zinc-800 py-6 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-xs text-zinc-400">
              © 2026 Aetheris Analytics. All rights reserved.
            </p>
            <p className="text-[10px] text-zinc-500">
              Access restricted to authorized personnel only. All interactions are monitored and audited.
            </p>
          </div>
        </footer>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 p-6 rounded-lg shadow-md max-w-sm border border-zinc-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
                  <Lock className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-white">Password Reset</h2>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                Contact your systems administrator to reset your account password.
              </p>

              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render main dashboard frame
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content wrapper */}
      <main className="flex-1 pl-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "etl" && <EtlOrchestrator />}
          {activeTab === "sap" && <SapExplorer />}
          {activeTab === "powerbi" && <PowerBiEmbed />}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
