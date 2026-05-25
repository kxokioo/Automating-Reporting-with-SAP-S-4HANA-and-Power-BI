import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type UserRole =
  | "Admin"
  | "FinancialAnalyst"
  | "LogisticsManager"
  | "Viewer";

interface UserSession {
  username: string;
  role: UserRole;
  token: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  login: (username: string, role: UserRole, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt local storage session restoration on mount
    const savedUser = localStorage.getItem("aetheris_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Verify token exists and has valid structure
        if (parsed.username && parsed.role && parsed.token) {
          setUser(parsed);
        } else {
          localStorage.removeItem("aetheris_user");
        }
      } catch (e) {
        console.error("Failed to parse saved user session:", e);
        localStorage.removeItem("aetheris_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (username: string, role: UserRole, token: string) => {
      const session: UserSession = { username, role, token };
      setUser(session);
      localStorage.setItem("aetheris_user", JSON.stringify(session));
      setLastError(null);
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("aetheris_user");
    setLastError(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, role };
      localStorage.setItem("aetheris_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});

      // Get token from localStorage to ensure we always use current token
      let activeToken = user?.token;
      if (!activeToken) {
        const savedUserStr = localStorage.getItem("aetheris_user");
        if (savedUserStr) {
          try {
            activeToken = JSON.parse(savedUserStr).token;
          } catch (e) {
            console.error("Failed to get token from storage:", e);
          }
        }
      }

      if (activeToken) {
        headers.set("Authorization", `Bearer ${activeToken}`);
      }

      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

      try {
        const response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });

        // Handle authentication failures
        if (response.status === 401) {
          setLastError("Session expired or invalid. Please log in again.");
          logout();
        } else if (response.status === 403) {
          setLastError("You do not have permission to access this resource.");
        } else if (response.status === 429) {
          setLastError("Too many requests. Please slow down and try again.");
        } else if (!response.ok && response.status >= 500) {
          setLastError("Server error. Please try again later.");
        }

        return response;
      } catch (error) {
        const errorMsg = `Failed to fetch ${path}: ${error instanceof Error ? error.message : "Unknown error"}`;
        setLastError(errorMsg);
        console.error(errorMsg);
        throw error;
      }
    },
    [user, logout],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        isLoading,
        apiFetch,
        lastError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
