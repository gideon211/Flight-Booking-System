import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

const FlightsListTable = () => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const rowsPerPage = 10;

    useEffect(() => {
        fetchFlights();
    }, []);

    const fetchFlights = async () => {
        try {
            const response = await api.get("/admin/flights");
            setFlights(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching flights:", err);
            setError("Failed to load flights");
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        if (!newStatus) {
            alert("Please select a status");
            return;
        }

        try {
            await api.put(`/admin/flights/${selectedFlight.flight_id}/status`, { status: newStatus });
            // Refresh flights list
            fetchFlights();
            setShowStatusModal(false);
            setSelectedFlight(null);
            setNewStatus("");
        } catch (err) {
            console.error("Error updating flight status:", err);
            alert("Failed to update flight status");
        }
    };

    const openStatusModal = (flight) => {
        setSelectedFlight(flight);
        setNewStatus(flight.flight_status); // Set current status as default
        setShowStatusModal(true);
    };

    const filteredFlights = flights
        .filter(f => filterStatus === "All" || f.flight_status === filterStatus)
        .filter(f => 
            f.flight_id?.toLowerCase().includes(search.toLowerCase()) ||
            f.airline?.toLowerCase().includes(search.toLowerCase()) ||
            f.departure_city_code?.toLowerCase().includes(search.toLowerCase()) ||
            f.arrival_city_code?.toLowerCase().includes(search.toLowerCase())
        );

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredFlights.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredFlights.length / rowsPerPage);

    if (loading) {
        return <div className="p-6 text-center">Loading flights...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="p-4 space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Search flight ID, airline, route..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="border-2 border-blue-200 rounded px-3 py-2 outline-none placeholder:text-sm w-64" 
                    />
                    <select 
                        value={filterStatus} 
                        onChange={e => setFilterStatus(e.target.value)} 
                        className="border-2 border-blue-200 outline-none px-3 py-2 rounded"
                    >
                        <option>All</option>
                        <option>scheduled</option>
                        <option>active</option>
                        <option>cancelled</option>
                        <option>completed</option>
                    </select>
                </div>
                <div className="text-gray-600 font-medium">
                    Total Flights: {filteredFlights.length}
                </div>
            </div>

            {/* Flights Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full">
                    <thead>
                        <tr className="bg-blue-600 text-white">
                            <th className="px-4 py-3 text-left">Flight ID</th>
                            <th className="px-4 py-3 text-left">Airline</th>
                            <th className="px-4 py-3 text-left">Route</th>
                            <th className="px-4 py-3 text-left">Departure</th>
                            <th className="px-4 py-3 text-left">Cabin</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-center">Seats</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.length > 0 ? (
                            currentRows.map((flight, index) => (
                                <tr 
                                    key={flight.flight_id || index} 
                                    className="border-b hover:bg-blue-50 transition"
                                >
                                    <td className="px-4 py-3 font-medium text-blue-600">
                                        {flight.flight_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        {flight.airline}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{flight.departure_city_code}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="font-semibold">{flight.arrival_city_code}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {flight.origin_country} → {flight.destination_country}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {flight.departure_datetime ? 
                                            new Date(flight.departure_datetime).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        {flight.cabin_class || 'Economy'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                                        GHS {parseFloat(flight.price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            flight.seats_available > 10 
                                                ? 'bg-green-100 text-green-700' 
                                                : flight.seats_available > 0 
                                                ? 'bg-yellow-100 text-yellow-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {flight.seats_available}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            flight.flight_status === 'active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : flight.flight_status === 'scheduled'
                                                ? 'bg-blue-100 text-blue-700'
                                                : flight.flight_status === 'cancelled' 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {flight.flight_status || 'scheduled'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => openStatusModal(flight)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                                        >
                                            Change Status
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                    No flights found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(p-1,1))} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed" 
                    disabled={currentPage===1}
                >
                    Previous
                </button>
                <span className="text-gray-600">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed" 
                    disabled={currentPage===totalPages || totalPages === 0}
                >
                    Next
                </button>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && selectedFlight && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-96">
                        <h3 className="text-xl font-bold mb-4">Change Flight Status</h3>
                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">
                                <strong>Flight:</strong> {selectedFlight.flight_id}
                            </p>
                            <p className="text-gray-600 mb-2">
                                <strong>Route:</strong> {selectedFlight.departure_city_code} → {selectedFlight.arrival_city_code}
                            </p>
                            <p className="text-gray-600 mb-4">
                                <strong>Current Status:</strong> 
                                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                                    selectedFlight.flight_status === 'active' 
                                        ? 'bg-green-100 text-green-700' 
                                        : selectedFlight.flight_status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {selectedFlight.flight_status}
                                </span>
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select New Status:
                            </label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500 text-gray-800"
                            >
                                <option value="scheduled">🔵 Scheduled</option>
                                <option value="active">🟢 Active</option>
                                <option value="cancelled">🔴 Cancelled</option>
                                <option value="completed">⚪ Completed</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                {newStatus === 'scheduled' && '• Flight is planned but not yet active'}
                                {newStatus === 'active' && '• Flight is live and bookable by users'}
                                {newStatus === 'cancelled' && '• Flight is cancelled and hidden from users'}
                                {newStatus === 'completed' && '• Flight has been completed'}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedFlight(null);
                                    setNewStatus("");
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusChange}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightsListTable;
