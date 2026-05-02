import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("unilink_token") || sessionStorage.getItem("unilink_token") || "");
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const t = localStorage.getItem("unilink_token") || sessionStorage.getItem("unilink_token") || "";
    if (!t) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/me");
      setMe(data);
    } catch {
      setMe(null);
      setToken("");
      localStorage.removeItem("unilink_token");
      sessionStorage.removeItem("unilink_token");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, [token]);

  async function login(email, password, remember = false) {
    const { data } = await api.post("/auth/login", { email, password });
    if (remember) {
      localStorage.setItem("unilink_token", data.token);
    } else {
      sessionStorage.setItem("unilink_token", data.token);
    }
    setToken(data.token);
    await refreshMe();
    return { ...data, isProfileIncomplete: data.isProfileIncomplete };
  }

  async function loginGoogle() {
    const { data } = await api.post("/auth/google");
    localStorage.setItem("unilink_token", data.token);
    setToken(data.token);
    await refreshMe();
    return { ...data, isProfileIncomplete: data.isProfileIncomplete };
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    if (data.token) {
      localStorage.setItem("unilink_token", data.token);
      setToken(data.token);
      await refreshMe();
    }
    return { ...data, isProfileIncomplete: data.isProfileIncomplete ?? true };
  }

  function logout() {
    localStorage.removeItem("unilink_token");
    sessionStorage.removeItem("unilink_token");
    setToken("");
    setMe(null);
  }

  const value = useMemo(
    () => ({ token, me, loading, login, loginGoogle, register, logout, refreshMe }),
    [token, me, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

