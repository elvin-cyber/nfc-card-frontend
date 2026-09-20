import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const kind = window.sessionStorage.getItem("nfc_auth_kind");
      const token = window.sessionStorage.getItem("nfc_access_token");

      try {
        if (!token) return;

        // Ask only the endpoint that matches the token that was issued.
        // This prevents harmless 401 responses from appearing as error toasts
        // on the landing page/admin dashboard.
        const result = kind === "admin"
          ? await api.adminMe({ suppressToast: true })
          : await api.me({ suppressToast: true });

        if (active) setUser(result.user);
      } catch {
        // A stale/expired session is normal; clear it silently.
        window.sessionStorage.removeItem("nfc_access_token");
        window.sessionStorage.removeItem("nfc_auth_kind");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const { user: current } = await api.login({ email, password });
    setUser(current);
    return current;
  };

  const signup = async (name, email, password) => {
    const { user: current } = await api.signup({ name, email, password });
    setUser(current);
    return current;
  };

  const adminLogin = async (email, password) => {
    const { user: current } = await api.adminLogin({ email, password });
    setUser(current);
    return current;
  };

  const logout = async () => {
    try {
      if (user?.role?.includes("ADMIN")) await api.adminLogout();
      else await api.logout();
    } finally {
      setUser(null);
    }
  };

  const refresh = async () => {
    try {
      const kind = window.sessionStorage.getItem("nfc_auth_kind");
      const result = kind === "admin"
        ? await api.adminMe({ suppressToast: true })
        : await api.me({ suppressToast: true });
      setUser(result.user);
      return result.user;
    } catch {
      setUser(null);
      return null;
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, signup, adminLogin, logout, refresh }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
