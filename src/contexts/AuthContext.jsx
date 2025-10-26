/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");
    if (savedToken && savedUser) {
      // Cek token ke backend
      fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/refresh-session",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
        .then(async (res) => {
          if (!res.ok) throw new Error("Token tidak valid");
          const data = await res.json();
          if (data.valid && data.user) {
            setToken(savedToken);
            setUser(data.user);
            localStorage.setItem("authUser", JSON.stringify(data.user));
          } else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (username, password) => {
    try {
      const res = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.error || "Login gagal") };
      }
      // Persist session
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { data };
    } catch {
      return { error: new Error("Tidak dapat menghubungi server") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    signIn,
    signOut,
    loading,
    setUser, // tambahkan setUser agar bisa diakses dari komponen lain
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
