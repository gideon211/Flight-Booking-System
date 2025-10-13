import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // If no user, redirect to login
  if (!user) {
    // Redirect to appropriate login page based on required role
    if (allowedRoles && (allowedRoles.includes("admin") || allowedRoles.includes("superadmin"))) {
      return <Navigate to="/superadmin-login" replace />;
    }
    return <Navigate to="/login" replace />; 
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // redirect to home if wrong role
  }

  return children;
};

export default ProtectedRoute;
