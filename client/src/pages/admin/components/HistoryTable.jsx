import React, { useState, useEffect } from "react";

const HistoryTable = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Mock data - replace with API fetch if needed
    setHistory([
      {
        id: 1,
        flight: "Accra → London",
        action: "Created",
        user: "Admin",
        timestamp: "2025-09-20 10:30",
      },
      {
        id: 2,
        flight: "Accra → Dubai",
        action: "Edited",
        user: "Admin",
        timestamp: "2025-09-21 15:00",
      },
      {
        id: 3,
        flight: "Accra → Paris",
        action: "Deleted",
        user: "Admin",
        timestamp: "2025-09-22 09:45",
      },
    ]);
  }, []);

  return (
    <div className="bg-white rounded shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Flight History</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Flight</th>
            <th className="border px-2 py-1">Action</th>
            <th className="border px-2 py-1">User</th>
            <th className="border px-2 py-1">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.flight}</td>
              <td className="border px-2 py-1">{item.action}</td>
              <td className="border px-2 py-1">{item.user}</td>
              <td className="border px-2 py-1">{item.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
