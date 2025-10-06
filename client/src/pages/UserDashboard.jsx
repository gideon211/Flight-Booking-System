import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import api from "../api/axios";
import Loader from "../components/Loader";

const UserDashboard = () => {
    const [flights, setFlights] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [formData, setFormData] = useState({
        tripType: "oneway",
        from: "",
        to: "",
        departureDate: "",
        returnDate: "",
        passengers: 1,
        cabin: "Economy",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const res = await api.get("/flights");
                setFlights(res.data);
            } catch (error) {
                console.error("Error fetching flights:", error);
            }
        };
        fetchFlights();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        
        setTimeout(() => {
            const filtered = flights.filter((flight) => {
                return (
                    (!formData.from ||
                        flight.origin.city
                            .toLowerCase()
                            .includes(formData.from.toLowerCase())) &&
                    (!formData.to ||
                        flight.destination.city
                            .toLowerCase()
                            .includes(formData.to.toLowerCase())) &&
                    (!formData.cabin ||
                        flight.cabin.toLowerCase() === formData.cabin.toLowerCase()) &&
                    flight.seatsAvailable >= Number(formData.passengers || 1)
                );
            });
            
            setSearchResults(filtered);
            setShowResults(true);
            setLoading(false);
        }, 1500);
    };

    const handleSelectFlight = (flight) => {
        navigate(`/itinerary/${flight.flightId}`, { 
            state: { 
                flight,
                from: formData.from,
                to: formData.to
            } 
        });
    };

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col">
            {loading && (
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
                    <Loader />
                </div>
            )}

            <Navbar />

            {/* Search Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Search & Book Flights</h1>
                    <p className="text-blue-100 mb-6">Find the best deals for your next trip</p>

                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6">
                        {/* Trip Type */}
                        <div className="flex gap-4 mb-6">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-yellow-100">
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="oneway"
                                    checked={formData.tripType === "oneway"}
                                    onChange={handleChange}
                                    className="accent-yellow-500"
                                />
                                <span className="font-medium text-gray-800">One Way</span>
                            </label>

                            <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-yellow-100">
                                <input
                                    type="radio"
                                    name="tripType"
                                    value="round"
                                    checked={formData.tripType === "round"}
                                    onChange={handleChange}
                                    className="accent-yellow-500"
                                />
                                <span className="font-medium text-gray-800">Round Trip</span>
                            </label>
                        </div>

                        {/* Search Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                <input
                                    type="text"
                                    name="from"
                                    value={formData.from}
                                    onChange={handleChange}
                                    placeholder="Origin City"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="text"
                                    name="to"
                                    value={formData.to}
                                    onChange={handleChange}
                                    placeholder="Destination City"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                                <Flatpickr
                                    name="departureDate"
                                    placeholder="Select date"
                                    value={formData.departureDate}
                                    options={{ dateFormat: "Y-m-d", minDate: "today" }}
                                    onChange={(selectedDates, dateStr) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            departureDate: dateStr,
                                        }));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                                <Flatpickr
                                    name="returnDate"
                                    value={formData.returnDate}
                                    options={{ dateFormat: "Y-m-d", minDate: formData.departureDate || "today" }}
                                    onChange={(selectedDates, dateStr) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            returnDate: dateStr,
                                        }));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                    placeholder="Select date"
                                    disabled={formData.tripType === "oneway"}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                                <input
                                    type="number"
                                    name="passengers"
                                    min="1"
                                    max="9"
                                    value={formData.passengers}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Class</label>
                                <select
                                    name="cabin"
                                    value={formData.cabin}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                >
                                    <option>Economy</option>
                                    <option>Premium</option>
                                    <option>Business</option>
                                    <option>First Class</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-semibold shadow-lg cursor-pointer transition"
                            >
                                Search Flights
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Results Section */}
            {showResults && (
                <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-2">
                            {formData.from.toUpperCase()} → {formData.to.toUpperCase()}
                        </h2>
                        <p className="text-gray-600">
                            {searchResults.length} flight{searchResults.length !== 1 ? "s" : ""} found
                        </p>
                    </div>

                    {searchResults.length > 0 ? (
                        <div className="space-y-4">
                            {searchResults.map((flight) => (
                                <div
                                    key={flight.flightId}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                                                alt={flight.airline}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                            <div>
                                                <p className="font-semibold text-lg">{flight.airline}</p>
                                                <p className="text-sm text-gray-500">{flight.code}</p>
                                                <p className="text-sm text-gray-600">{flight.cabin}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 text-center">
                                            <p className="font-medium text-lg">
                                                {flight.departureTime} → {flight.arrivalTime}
                                            </p>
                                            <p className="text-sm text-gray-500">{flight.duration}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {flight.origin.city} → {flight.destination.city}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">
                                                GHS {flight.price}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-3">per person</p>
                                            <button
                                                onClick={() => handleSelectFlight(flight)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-medium shadow cursor-pointer transition"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-600 text-lg mb-4">
                                No flights found matching your search criteria.
                            </p>
                            <button
                                onClick={() => setShowResults(false)}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Try a different search
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!showResults && (
                <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">
                            Welcome to Your Flight Dashboard
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Search for flights above to start booking your next journey
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="p-6 bg-blue-50 rounded-lg">
                                <div className="text-4xl mb-3">✈️</div>
                                <h4 className="font-semibold mb-2">Search Flights</h4>
                                <p className="text-sm text-gray-600">
                                    Find the best flights for your destination
                                </p>
                            </div>
                            <div className="p-6 bg-blue-50 rounded-lg">
                                <div className="text-4xl mb-3">💳</div>
                                <h4 className="font-semibold mb-2">Secure Payment</h4>
                                <p className="text-sm text-gray-600">
                                    Multiple payment options available
                                </p>
                            </div>
                            <div className="p-6 bg-blue-50 rounded-lg">
                                <div className="text-4xl mb-3">🎫</div>
                                <h4 className="font-semibold mb-2">Get Your Ticket</h4>
                                <p className="text-sm text-gray-600">
                                    Instant confirmation and e-ticket
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default UserDashboard;
