import React, { useState, useEffect, useRef } from "react";

const TicketTable = () => {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [modalData, setModalData] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const dropdownRef = useRef();

    useEffect(() => {
        setTickets([
            { id: 1, flight: "Accra → London", date: "2025-09-20", price: 1200, status: "Confirmed", user: { name: "Will Smith", email: "willsmith@gmail.com" } },
            { id: 2, flight: "Accra → Dubai", date: "2025-10-01", price: 950, status: "Pending", user: { name: "Jaden Smith", email: "syre@gmail.com" } },
            { id: 3, flight: "Kumasi → Accra", date: "2025-10-05", price: 300, status: "Pending", user: { name: "Willow Smith", email: "willow@gmail.com" } },
            { id: 4, flight: "Tamale → Accra", date: "2025-10-10", price: 400, status: "Cancel", user: { name: "Jada Smith", email: "jada@gmail.com" } },
        ]);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(null);
        }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredTickets = tickets
    .filter(t => filterStatus === "All" || t.status === filterStatus)
    .filter(t => t.flight.toLowerCase().includes(search.toLowerCase()) || t.date.includes(search) || t.user.name.toLowerCase().includes(search.toLowerCase()));

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredTickets.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

    const handleDelete = id => setTickets(tickets.filter(t => t.id !== id));
    const handleStatusChange = (id, newStatus) => setConfirmAction({ id, newStatus });
    const confirmStatusChange = () => {
        const { id, newStatus } = confirmAction;
        setTickets(tickets.map(t => t.id === id ? {...t, status: newStatus} : t));
        setConfirmAction(null);
    };
    const saveEdit = () => {
        setTickets(tickets.map(t => t.id === modalData.id ? modalData : t));
        setModalData(null);
    };

    const getActions = (ticket) => {
        const actions = [];
        if (ticket.status === "Pending") {
        actions.push({ label: "Approve", action: () => handleStatusChange(ticket.id, "Confirmed") });
        actions.push({ label: "Cancel", action: () => handleStatusChange(ticket.id, "Cancelled") });
        }
        if (ticket.status === "Confirmed") {
        actions.push({ label: "Cancel", action: () => handleStatusChange(ticket.id, "Cancelled") });
        }
        actions.push({ label: "Edit", action: () => setModalData(ticket) });
        actions.push({ label: "Delete", action: () => handleDelete(ticket.id) });
        return actions;
    };

  return (
    <div className="p-4 space-y-4">
  
        <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Search flight/date/user" value={search} onChange={e => setSearch(e.target.value)} className="border-2 border-red-200 rounded px-3 py-2 outline-none placeholder:text-sm" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border-2 border-red-200 outline-none text-center py-1">
                <option>All</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
            </select>
            <button onClick={() => setModalData({ id: null, flight: "", date: "", price: 0, status: "Confirmed", user: { name: "", email: "" } })} className="bg-red-500 text-white px-3 py-1 rounded cursor-pointer">Add Ticket</button>
        </div>

   
      <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="bg-red-400">
                {["Flight","Date","Price","Status","User","Actions"].map(col => (
                    <th key={col} className="px-2 py-1 text-center text-white">{col}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {currentRows.map(t => (
                <tr key={t.id} className="hover:bg-gray-300 cursor-pointer" onClick={() => setModalData(t)}>
                    <td className="border px-2 py-1 text-center">{t.flight}</td>
                    <td className="border px-2 py-1 text-center">{t.date}</td>
                    <td className="border px-2 py-1 text-center">${t.price.toLocaleString()}</td>
                    <td className={`border px-2 py-1 font-medium text-center ${t.status === "Confirmed" ? "text-green-600" : t.status === "Pending" ? "text-yellow-600" : "text-red-600"}`}>{t.status}</td>
                    <td className="border px-2 py-1 text-center">{t.user.name}</td>
                    <td className="border px-2 py-1 text-center relative" ref={dropdownRef}>
                        <button onClick={e => { e.stopPropagation(); setDropdownOpen(dropdownOpen === t.id ? null : t.id); }} className="bg-blue-500 text-white px-3 py-1 rounded">Action</button>
                        {dropdownOpen === t.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow-lg z-20">
                                {getActions(t).map((act, idx) => (
                                    <button key={idx} onClick={e => { e.stopPropagation(); act.action(); setDropdownOpen(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-200">{act.label}</button>
                                ))}
                            </div>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>


        <div className="flex justify-between items-center">
            <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} className="px-3 py-1 bg-gray-200 rounded" disabled={currentPage===1}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} className="px-3 py-1 bg-gray-200 rounded" disabled={currentPage===totalPages}>Next</button>
        </div>

    
        {modalData && (
            <div className="fixed inset-0 flex justify-center items-center bg-black/40">
                <div className="bg-white border-2 border-red-200 p-6 rounded shadow w-96 space-y-2">
                    <h3 className="text-2xl font-semibold text-center">{modalData.id ? "Ticket Details" : "Add Ticket"}</h3>
                    <p><strong>Flight:</strong> {modalData.flight}</p>
                    <p><strong>Date:</strong> {modalData.date}</p>
                    <p><strong>Price:</strong> ${modalData.price.toLocaleString()}</p>
                    <p><strong>Status:</strong> {modalData.status}</p>
                    <p><strong>User Name:</strong> {modalData.user?.name}</p>
                    <p><strong>User Email:</strong> {modalData.user?.email}</p>
                    <div className="grid grid-cols-2  gap-2 mt-2">
                        <select value={modalData.status} onChange={e => setModalData({...modalData, status:e.target.value})} className="border border-red-200 outline-red-300 p-1 w-full rounded">
                            <option>Confirmed</option>
                            <option>Pending</option>
                            <option>Cancel</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={()=>setModalData(null)} className="px-3 py-1 bg-gray-300">Cancel</button>
                        <button onClick={saveEdit} className="px-3 py-1 bg-yellow-500 text-white rounded">Save</button>
                    </div>
                </div>
            </div>
        )}

      
      {confirmAction && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40">
          <div className="bg-white p-6 rounded shadow w-80 space-y-4 text-center">
            <p className="text-lg font-semibold">
              Are you sure you want to {confirmAction.newStatus} this ticket?
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={()=>setConfirmAction(null)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              <button onClick={confirmStatusChange} className="px-3 py-1 bg-red-500 text-white rounded">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
