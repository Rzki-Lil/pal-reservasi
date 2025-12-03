/* eslint-disable no-unused-vars */
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
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        fetch("https://settled-modern-stinkbug.ngrok-free.app/api/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("Token tidak valid");
            const data = await res.json();

            setToken(savedToken);
            setUser(data);
            localStorage.setItem("authUser", JSON.stringify(data));
          })
          .catch(() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            setToken(null);
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (tokenOrPhone, userOrPassword) => {
    if (typeof tokenOrPhone === "string" && typeof userOrPassword === "object") {
      setUser(userOrPassword);
      setToken(tokenOrPhone);
      localStorage.setItem("authToken", tokenOrPhone);
      localStorage.setItem("authUser", JSON.stringify(userOrPassword));
      return { user: userOrPassword, token: tokenOrPhone };
    }

    try {
      const response = await fetch(
        "https://settled-modern-stinkbug.ngrok-free.app/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ phone: tokenOrPhone, password: userOrPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authUser", JSON.stringify(data.user));
        return { user: data.user, token: data.token };
      } else {
        return { error: { message: data.message } };
      }
    } catch (error) {
      return { error: { message: "Gagal menghubungi server" } };
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
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
