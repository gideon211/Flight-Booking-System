import React, { useState } from "react";
import FlightForm from "../components/FlightForm";
import TicketTable from "../components/TicketTable";
import HistoryTable from "../components/HistoryTable";

const AdminFlights = () => {
  const [activeTab, setActiveTab] = useState("form");

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">DASH-BOARD</h1>

   
      <div className="flex gap-4 mb-6 ">
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
      </div>
    </div>
  );
};

export default AdminFlights;
