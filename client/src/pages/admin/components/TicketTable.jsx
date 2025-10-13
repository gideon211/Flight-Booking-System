import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/axios";

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
        fetchBookings();
        
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchBookings();
        }, 30000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const fetchBookings = async () => {
        try {
            console.log('TicketTable: Fetching bookings from /admin/bookings');
            const response = await api.get('/admin/bookings');
            
            console.log('TicketTable: Response received:', response);
            console.log('TicketTable: Raw data received:', response.data);
            console.log('TicketTable: Number of bookings:', response.data.bookings ? response.data.bookings.length : 0);
            
            // Check if bookings data exists and is an array
            if (!response.data.bookings || !Array.isArray(response.data.bookings)) {
                console.warn('TicketTable: No bookings array found in response');
                setTickets([]);
                return;
            }
            
            // Transform the data to match the expected format
            const transformedBookings = response.data.bookings.map(booking => {
                // Safe data extraction with fallbacks
                const departureCity = booking.departure_city_code || 'Unknown';
                const arrivalCity = booking.arrival_city_code || 'Unknown';
                const userName = booking.user_name || (booking.user_email ? booking.user_email.split('@')[0] : 'Unknown User');
                const userEmail = booking.user_email || 'unknown@email.com';
                const bookingStatus = booking.status || 'pending';
                const departureDate = booking.departure_datetime ? new Date(booking.departure_datetime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
                return {
                    id: booking.booking_id,
                    flight: `${departureCity} → ${arrivalCity}`,
                    date: departureDate,
                    price: booking.payment_amount || booking.price || 0,
                    status: bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1),
                    user: { 
                        name: userName,
                        email: userEmail 
                    },
                    airline: booking.airline || 'Unknown Airline',
                    booking_date: booking.booking_date,
                    payment_method: booking.payment_method || 'N/A',
                    payment_status: booking.payment_status || 'N/A'
                };
            });
            console.log('TicketTable: Transformed bookings:', transformedBookings);
            console.log('TicketTable: Cancelled bookings:', transformedBookings.filter(b => b.status === 'Cancelled'));
            setTickets(transformedBookings);
        } catch (error) {
            console.error('TicketTable: Error fetching bookings:', error);
            console.error('TicketTable: Error details:', error.response?.data);
            // Fallback to empty array if fetch fails
            setTickets([]);
        }
    };

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
    const confirmStatusChange = async () => {
        const { id, newStatus } = confirmAction;
        
        try {
            if (newStatus === "Cancelled") {
                console.log(`TicketTable: Attempting to cancel booking ${id}`);
                // Make API call to cancel the booking
                const response = await api.post('/cancelbooking', { booking_id: id });
                console.log(`TicketTable: Cancel response:`, response);
                
                if (response.status === 200) {
                    console.log(`TicketTable: Booking ${id} cancelled successfully`);
                    // Update local state and refresh data
                    setTickets(tickets.map(t => t.id === id ? {...t, status: newStatus} : t));
                    // Refresh the bookings data from server
                    console.log(`TicketTable: Refreshing bookings data...`);
                    await fetchBookings();
                    alert('Booking cancelled successfully!');
                } else {
                    console.log(`TicketTable: Cancel failed with status:`, response.status);
                    alert('Failed to cancel booking. Please try again.');
                }
            } else {
                // For other status changes, just update locally for now
                // TODO: Add API endpoints for other status changes
                setTickets(tickets.map(t => t.id === id ? {...t, status: newStatus} : t));
            }
        } catch (error) {
            console.error('TicketTable: Error updating booking status:', error);
            console.error('TicketTable: Error details:', error.response?.data);
            alert('Failed to update booking status. Please try again.');
        }
        
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

    console.log(`TicketTable: Rendering ${tickets.length} total tickets, ${filteredTickets.length} filtered tickets, ${currentRows.length} current page tickets`);
    
    return (
        <div className="p-4 space-y-4">
            {tickets.length === 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    No bookings found. Create some test bookings first to see the dropdown actions.
                </div>
            )}
            
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
                                <td className="border px-2 py-1 text-center relative">
                                    <button 
                                        onClick={e => { 
                                            e.stopPropagation(); 
                                            console.log(`TicketTable: Dropdown clicked for booking ${t.id}`);
                                            setDropdownOpen(dropdownOpen === t.id ? null : t.id); 
                                        }} 
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                    >
                                        Action
                                    </button>
                                    {dropdownOpen === t.id && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow-lg z-20">
                                            {getActions(t).map((act, idx) => (
                                                <button 
                                                    key={idx} 
                                                    onClick={e => { 
                                                        e.stopPropagation(); 
                                                        console.log(`TicketTable: Action clicked: ${act.label} for booking ${t.id}`);
                                                        act.action(); 
                                                        setDropdownOpen(null); 
                                                    }} 
                                                    className="block w-full text-left px-3 py-1 hover:bg-gray-200"
                                                >
                                                    {act.label}
                                                </button>
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
