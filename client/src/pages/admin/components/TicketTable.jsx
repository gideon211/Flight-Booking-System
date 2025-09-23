import React, { useState, useEffect } from "react";


const TicketTable = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    
    setTickets([
      { id: 1, flight: "Accra → London", date: "2025-09-20" },
      { id: 2, flight: "Accra → Dubai", date: "2025-10-01" },
    ]);
  }, []);

  const handleDelete = (id) => {
    setTickets(tickets.filter((t) => t.id !== id));
  };

  const handleEdit = (id) => {
    alert("" );
  };

  return (
    <div className="bg-white rounded shadow-md p-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-red-100">
            <th className="border px-2 py-1">Flight</th>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className="border px-2 py-1 text-center font-medium">{t.flight}</td>
              <td className="border px-2 py-1 text-center">{t.date}</td>
              <td className="border px-2 py-1 space-x-4 text-center">
                <button onClick={() => handleEdit(t.id)} className="bg-yellow-500 px-2 py-1 rounded text- cursor-pointer">Edit</button>
                <button onClick={() => handleDelete(t.id)} className="bg-red-500 px-2 py-1 rounded text-white cursor-pointer">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
