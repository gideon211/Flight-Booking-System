import React, { createContext, useState, useEffect } from "react";
import { getProfile, logoutUser } from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

        useEffect(() => {
                
                const fetchProfile = async () => {
                        try {
                                const data = await getProfile();
                                setUser(data.user);
                        } catch (err) {
                                setUser(null);
                        } finally {
                                setLoading(false); 
                        }
                };
                fetchProfile();
        }, []);

       const logout = async () => {
                
                await logoutUser();
                setUser(null);
        };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
           {children}
    </AuthContext.Provider>
  );
};
