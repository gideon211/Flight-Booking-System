import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Import your pages
import Home from "./pages/Home";
import UserDashboard from "./pages/UserDashboard";
import AdminFlights from "./pages/admin/pages/AdminFlights";
import SuperAdminDashboard from "./pages/admin/pages/SuperAdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SuperAdminLogin from "./pages/AdminLogin";
import ItineraryPage from "./pages/Itinerary";
import EmailPage from "./pages/email";
import TravelerPage from "./pages/traveler";
import PaymentPage from "./pages/payment";
import TicketSection from "./pages/Ticketsection";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/superadmin-login" element={<SuperAdminLogin />} />
      <Route path="/ticketsection" element={<TicketSection />} />

      {/* Normal User Dashboard */}
      <Route
        path="/flights-dashboard"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/itinerary/:flightId"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <ItineraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <EmailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/traveler"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <TravelerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <PaymentPage />
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