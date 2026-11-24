import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("certiverify_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn("Session check failed, logging out:", err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.auth.login(identifier, password);
    if (res.success && res.token) {
      localStorage.setItem("certiverify_token", res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || "Login failed");
  };

  const logout = () => {
    localStorage.removeItem("certiverify_token");
    setToken(null);
    setUser(null);
  };

  const updateWalletAddress = async (walletAddress) => {
    try {
      await api.auth.updateWallet(walletAddress);
      setUser((prev) => (prev ? { ...prev, walletAddress } : prev));
    } catch (e) {
      console.warn("Could not sync wallet with backend profile:", e.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin" || user?.role === "superadmin",
        loading,
        login,
        logout,
        updateWalletAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

