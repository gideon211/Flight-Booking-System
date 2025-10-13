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
            } catch (error) {
                // Silently handle auth errors on initial load
                // This is expected behavior for non-authenticated users
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
        try {
            // Backend clears httpOnly cookies
            await api.post("/logout");
        } catch (error) {
            console.error("Logout error:", error);
        }
        
        // Clear user state
        setUser(null);
        
        // Clear any other stored data (if any exists)
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to home page
        window.location.replace("/");
    };

    return (
        <AuthContext.Provider 
        value={{ user, login, signup, logout, loading, setUser }}
        >
          {children}
        </AuthContext.Provider>
    );
};
