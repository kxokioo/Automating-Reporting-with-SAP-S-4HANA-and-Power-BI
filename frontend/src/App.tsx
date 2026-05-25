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
  AlertCircle,
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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);

    // Validate inputs
    if (!usernameInput.trim()) {
      setLoginError("Username is required");
      setIsSubmitting(false);
      return;
    }
    if (!passwordInput) {
      setLoginError("Password is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

      const formData = new URLSearchParams();
      formData.append("username", usernameInput);
      formData.append("password", passwordInput);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-darkspace-bg flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-darkspace-glowViolet border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
          Initializing Gateway Session...
        </p>
      </div>
    );
  }

  // Render Login Sheet if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-darkspace-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow anomalies */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-darkspace-glowViolet/15 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-darkspace-glowTeal/10 rounded-full blur-[100px] animate-pulse-glow"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl space-y-6 relative border border-white/10">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-darkspace-glowViolet to-darkspace-glowTeal flex items-center justify-center neon-glow-violet mb-2">
              <svg className="w-10 h-10" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <text x="50" y="62" fontSize="42" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="-2">SAP</text>
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Aetheris Analytics
            </h1>
            <p className="text-xs text-indigo-200/60 font-semibold tracking-wider uppercase">
              Enterprise Gateway
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/30 text-xs text-rose-300 font-semibold flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0728] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-darkspace-glowViolet focus:ring-1 focus:ring-darkspace-glowViolet transition-all disabled:opacity-50"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#0a0728] border border-white/10 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-darkspace-glowViolet focus:ring-1 focus:ring-darkspace-glowViolet transition-all disabled:opacity-50"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
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
                className="text-[10px] text-darkspace-glowViolet hover:text-darkspace-glowTeal transition-colors font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-darkspace-glowViolet to-darkspace-glowIndigo hover:brightness-110 text-white font-bold py-3 rounded-lg text-sm transition-all duration-300 neon-glow-violet shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Authenticating..." : "Authenticate"}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <p className="text-[10px] text-slate-400 text-center">
              Access restricted to authorized personnel only
            </p>
            <p className="text-[9px] text-slate-500 text-center">
              © 2026 SAP Aetheris Analytics. All rights reserved.
            </p>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass-panel p-6 rounded-2xl shadow-2xl max-w-sm border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-darkspace-glowViolet to-darkspace-glowTeal flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Password Reset</h2>
              </div>
              
              <p className="text-sm text-slate-300">
                Please contact your system administrator to reset your password. They will assist you with regaining access to your account.
              </p>
              
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-full bg-gradient-to-r from-darkspace-glowViolet to-darkspace-glowIndigo hover:brightness-110 text-white font-bold py-2 rounded-lg text-sm transition-all duration-300 neon-glow-violet"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render main dashboard frame
  return (
    <div className="flex min-h-screen bg-darkspace-bg">
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
