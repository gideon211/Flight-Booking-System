import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import FlightForm from "../components/FlightForm";
import FlightsListTable from "../components/FlightsListTable";
import TicketTable from "../components/TicketTable";
import HistoryTable from "../components/HistoryTable";
import OverviewDashboard from "../components/OverviewDashboard";

const AdminFlights = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Header with Logout */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-600">Manage flights and bookings</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow transition"
                >
                    Logout
                </button>
            </div>
    
            <div className="flex gap-4 mb-6 flex-wrap">
                <button
                className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "overview" ? "bg-yellow-500 text-white" : "bg-white"}`}
                onClick={() => setActiveTab("overview")}
                >
                OVERVIEW
                </button>
                <button
                className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "flights" ? "bg-yellow-500 text-white" : "bg-white"}`}
                onClick={() => setActiveTab("flights")}
                >
                ALL FLIGHTS
                </button>
                <button
                className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "form" ? "bg-yellow-500 text-white" : "bg-white"}`}
                onClick={() => setActiveTab("form")}
                >
                ADD FLIGHT
                </button>
                <button
                className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "tickets" ? "bg-yellow-500 text-white" : "bg-white"}`}
                onClick={() => setActiveTab("tickets")}
                >
                BOOKINGS
                </button>
                <button
                className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "history" ? "bg-yellow-500 text-white" : "bg-white"}`}
                onClick={() => setActiveTab("history")}
                >
                HISTORY
                </button>
            </div>

    
            <div>
                {activeTab === "overview" && <OverviewDashboard />}
                {activeTab === "flights" && <FlightsListTable />}
                {activeTab === "form" && <FlightForm />}
                {activeTab === "tickets" && <TicketTable />}
                {activeTab === "history" && <HistoryTable />}
            </div>
        </div>
    );
};

export default AdminFlights;
