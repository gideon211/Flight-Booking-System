import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Import your pages
import Home from "./pages/Home";
import FlightsDashboard from "./pages/Availableflights";
import AdminFlights from "./pages/admin/pages/AdminFlights";
import SuperAdminDashboard from "./pages/admin/pages/SuperAdminDashboard";
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/AdminLogin";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/superadmin-login" element={<SuperAdminLogin />} />

      {/* Normal User Dashboard */}
      <Route
        path="/flights-dashboard"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <FlightsDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFlights />
          </ProtectedRoute>
        }
      />

      {/* SuperAdmin Dashboard */}
      <Route
        path="/superadmin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["superadmin"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;