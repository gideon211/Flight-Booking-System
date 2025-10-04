import React, { useState } from "react";
import OverviewDashboard from "../components/OverviewDashboard";
import UserManagement from "../components/UserManagement";
import AdminManagement from "../components/AdminManagement";
import SystemSettings from "../components/SystemSettings";
import AuditLogs from "../components/AuditLogs";

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">SuperAdmin Dashboard</h1>
                <p className="text-gray-600">Manage users, admins, and system settings</p>
            </div>

            <div className="flex gap-4 mb-6 flex-wrap">
                <button
                    className={`px-4 py-2 rounded cursor-pointer font-medium transition-colors ${
                        activeTab === "overview" 
                            ? "bg-purple-600 text-white" 
                            : "bg-white hover:bg-purple-50"
                    }`}
                    onClick={() => setActiveTab("overview")}
                >
                    OVERVIEW
                </button>
                <button
                    className={`px-4 py-2 rounded cursor-pointer font-medium transition-colors ${
                        activeTab === "users" 
                            ? "bg-purple-600 text-white" 
                            : "bg-white hover:bg-purple-50"
                    }`}
                    onClick={() => setActiveTab("users")}
                >
                    USER MANAGEMENT
                </button>
                <button
                    className={`px-4 py-2 rounded cursor-pointer font-medium transition-colors ${
                        activeTab === "admins" 
                            ? "bg-purple-600 text-white" 
                            : "bg-white hover:bg-purple-50"
                    }`}
                    onClick={() => setActiveTab("admins")}
                >
                    ADMIN MANAGEMENT
                </button>
                <button
                    className={`px-4 py-2 rounded cursor-pointer font-medium transition-colors ${
                        activeTab === "settings" 
                            ? "bg-purple-600 text-white" 
                            : "bg-white hover:bg-purple-50"
                    }`}
                    onClick={() => setActiveTab("settings")}
                >
                    SYSTEM SETTINGS
                </button>
                <button
                    className={`px-4 py-2 rounded cursor-pointer font-medium transition-colors ${
                        activeTab === "audit" 
                            ? "bg-purple-600 text-white" 
                            : "bg-white hover:bg-purple-50"
                    }`}
                    onClick={() => setActiveTab("audit")}
                >
                    AUDIT LOGS
                </button>
            </div>

            <div>
                {activeTab === "overview" && <OverviewDashboard />}
                {activeTab === "users" && <UserManagement />}
                {activeTab === "admins" && <AdminManagement />}
                {activeTab === "settings" && <SystemSettings />}
                {activeTab === "audit" && <AuditLogs />}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
