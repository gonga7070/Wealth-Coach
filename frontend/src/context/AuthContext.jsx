import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = logged out, obj = user
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wc_token");
    if (!token) {
      // No sign-in required: drop straight into the app with a guest session.
      api
        .post("/auth/guest")
        .then((r) => {
          localStorage.setItem("wc_token", r.data.token);
          setUser(r.data.user);
        })
        .catch(() => setUser(false))
        .finally(() => setBooting(false));
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => {
        localStorage.removeItem("wc_token");
        return api.post("/auth/guest").then((r) => {
          localStorage.setItem("wc_token", r.data.token);
          setUser(r.data.user);
        });
      })
      .catch(() => setUser(false))
      .finally(() => setBooting(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("wc_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("wc_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    localStorage.removeItem("wc_token");
    try {
      const { data } = await api.post("/auth/guest");
      localStorage.setItem("wc_token", data.token);
      setUser(data.user);
    } catch {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, booting }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
