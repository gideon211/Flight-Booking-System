import React, { useState, useEffect } from "react";

const TicketTable = () => {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalData, setModalData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    // Fetch or mock ticket data
    setTickets([
      { id: 1, flight: "Accra → London", date: "2025-09-20", price: 1200, status: "Confirmed", origin: "Accra", destination: "London" },
      { id: 2, flight: "Accra → Dubai", date: "2025-10-01", price: 950, status: "Pending", origin: "Accra", destination: "Dubai" },
      // add more
    ]);
  }, []);

  // Filters & search
  const filteredTickets = tickets
    .filter(t => (filterStatus === "All" || t.status === filterStatus))
    .filter(t => t.flight.toLowerCase().includes(search.toLowerCase()) || t.date.includes(search));

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTickets.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  const handleDelete = id => setTickets(tickets.filter(t => t.id !== id));
  const saveEdit = () => {
    setTickets(tickets.map(t => t.id === modalData.id ? modalData : t));
    setModalData(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Filters */}
      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Search flight/date" value={search} onChange={e => setSearch(e.target.value)} className="border-2 border-red-200 rounded px-3 py-2 outline-none placeholder:text-sm" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border-2 border-red-200 outline-none text-center  py-1">
          <option>All</option>
          <option className="cursor-pointer">Confirmed</option>
          <option className="cursor-pointer">Pending</option>
          <option className="cursor-pointer">Cancelled</option>
        </select>
        <button onClick={() => setModalData({ id: null, flight: "", date: "", price: 0, status: "Confirmed" })} className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer">Add Ticket</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-red-400">
              {["Flight","Date","Price","Status","Actions"].map(col => (
                <th key={col} className=" px-2 py-1 text-center text-white">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map(t => (
              <tr key={t.id} className="hover:bg-gray-300">
                <td className="border px-2 py-1 text-center">{t.flight}</td>
                <td className="border px-2 py-1 text-center">{t.date}</td>
                <td className="border px-2 py-1 text-center">${t.price.toLocaleString()}</td>
                <td className={`border px-2 py-1 font-medium text-center ${t.status === "Confirmed" ? "text-green-600" : t.status === "Pending" ? "text-yellow-600" : "text-red-600"}`}>{t.status}</td>
                <td className="border px-2 py-1 space-x-2 text-center">
                  <button onClick={() => setModalData(t)} className="bg-yellow-500 px-3 py-1 ">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="bg-red-500 text-white px-2 py-1 ">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} className="px-3 py-1 bg-gray-200 rounded" disabled={currentPage===1}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} className="px-3 py-1 bg-gray-200 rounded" disabled={currentPage===totalPages}>Next</button>
      </div>

      {/* Modal for Add/Edit */}
      {modalData && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40">
          <div className="bg-white p-6 rounded shadow w-96 space-y-2">
            <h3 className="text-lg font-semibold">{modalData.id ? "Edit Ticket" : "Add Ticket"}</h3>
            <input type="text" placeholder="Flight" value={modalData.flight} onChange={e => setModalData({...modalData, flight:e.target.value})} className="border p-1 w-full rounded" />
            <input type="date" value={modalData.date} onChange={e => setModalData({...modalData, date:e.target.value})} className="border p-1 w-full rounded" />
            <input type="number" placeholder="Price" value={modalData.price} onChange={e => setModalData({...modalData, price:e.target.value})} className="border p-1 w-full rounded" />
            <select value={modalData.status} onChange={e => setModalData({...modalData, status:e.target.value})} className="border p-1 w-full rounded">
              <option>Confirmed</option>
              <option>Pending</option>
              <option>Cancelled</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={()=>setModalData(null)} className="px-3 py-1 bg-gray-300">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-blue-500 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
