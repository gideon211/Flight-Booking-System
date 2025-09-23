import React, { useState } from "react";
import FlightForm from "../components/FlightForm";
import TicketTable from "../components/TicketTable";
import HistoryTable from "../components/HistoryTable";
import OverviewDashboard from "../components/OverviewDashboard"

const AdminFlights = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6 bg-gray-100 min-h-screen">


   
      <div className="flex gap-4 mb-6 ">
        <button
          className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "overview" ? "bg-yellow-500 text-white" : "bg-white"}`}
          onClick={() => setActiveTab("overview")}
        >
          OVERVIEW
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
          TICKETS
        </button>
        <button
          className={`px-4 py-2 rounded cursor-pointer font-medium ${activeTab === "history" ? "bg-yellow-500 text-white" : "bg-white"}`}
          onClick={() => setActiveTab("history")}
        >
          HISTORY
        </button>
      </div>

   
      <div>
        {activeTab === "form" && <FlightForm />}
        {activeTab === "tickets" && <TicketTable />}
        {activeTab === "history" && <HistoryTable />}
        {activeTab === "overview" && <OverviewDashboard />}
      </div>
    </div>
  );
};

export default AdminFlights;
