import React, { createContext, useState, useEffect } from "react";
import api from "../api/axios"; // axios instance withCredentials: true

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);


  const login = async (credentials) => {
    await api.post("/login", credentials);
    const res = await api.get("/me");
    setUser(res.data.user);
  };


  const signup = async (formData) => {
    await api.post("/signup", formData);
  };


  const logout = async () => {
    await api.post("/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
