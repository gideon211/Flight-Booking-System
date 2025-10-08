import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    // Redirect to appropriate login page based on required role
    if (allowedRoles && (allowedRoles.includes("admin") || allowedRoles.includes("superadmin"))) {
      return <Navigate to="/superadmin-login" replace />;
    }
    return <Navigate to="/login" replace />; 
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // redirect to home if wrong role
  }

  return children;
};

export default ProtectedRoute;
