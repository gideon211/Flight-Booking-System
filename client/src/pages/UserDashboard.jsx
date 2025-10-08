import React, { useState, useEffect, useRef } from "react";
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
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
    const originRef = useRef(null);
    const destinationRef = useRef(null);
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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (originRef.current && !originRef.current.contains(event.target)) {
                setShowOriginDropdown(false);
            }
            if (destinationRef.current && !destinationRef.current.contains(event.target)) {
                setShowDestinationDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch city suggestions based on user input
    const fetchCitySuggestions = async (query, isOrigin) => {
        if (!query || query.length < 2) {
            if (isOrigin) {
                setOriginSuggestions([]);
                setShowOriginDropdown(false);
            } else {
                setDestinationSuggestions([]);
                setShowDestinationDropdown(false);
            }
            return;
        }

        try {
            const res = await api.get(`/cities/search?q=${encodeURIComponent(query)}`);
            if (isOrigin) {
                setOriginSuggestions(res.data);
                setShowOriginDropdown(true);
            } else {
                setDestinationSuggestions(res.data);
                setShowDestinationDropdown(true);
            }
        } catch (error) {
            console.error("Error fetching city suggestions:", error);
        }
    };

    const selectCity = (cityName, isOrigin) => {
        if (isOrigin) {
            setFormData((prev) => ({ ...prev, from: cityName }));
            setShowOriginDropdown(false);
            setOriginSuggestions([]);
        } else {
            setFormData((prev) => ({ ...prev, to: cityName }));
            setShowDestinationDropdown(false);
            setDestinationSuggestions([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Trigger city search for origin and destination fields
        if (name === "from") {
            fetchCitySuggestions(value, true);
        } else if (name === "to") {
            fetchCitySuggestions(value, false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (formData.from) params.append('origin', formData.from);
            if (formData.to) params.append('destination', formData.to);
            if (formData.departureDate) params.append('date', formData.departureDate);
            if (formData.tripType) params.append('trip_type', formData.tripType);
            if (formData.cabin) params.append('cabin', formData.cabin);
            if (formData.passengers) params.append('passengers', formData.passengers);

            // Call backend search endpoint
            const response = await api.get(`/flights/search?${params.toString()}`);
            
            setSearchResults(response.data);
            setShowResults(true);
        } catch (error) {
            console.error("Error searching flights:", error);
            // If error or no results, show empty array
            setSearchResults([]);
            setShowResults(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFlight = (flight) => {
        navigate(`/itinerary/${flight.flight_id}`, { 
            state: { 
                flight,
                from: formData.from,
                to: formData.to
            } 
        });
    };

    const handleLogout = () => {
        // Clear any stored tokens or user data
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Navigate to home page
        navigate('/');
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
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Search & Book Flights</h1>
                            <p className="text-blue-100">Find the best deals for your next trip</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg transition"
                        >
                            Logout
                        </button>
                    </div>

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
                            {/* Origin Input with Autocomplete */}
                            <div className="relative" ref={originRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                <input
                                    type="text"
                                    name="from"
                                    value={formData.from}
                                    onChange={handleChange}
                                    onFocus={() => formData.from.length >= 2 && setShowOriginDropdown(true)}
                                    placeholder="Origin City"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                    autoComplete="off"
                                    required
                                />
                                {showOriginDropdown && originSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {originSuggestions.map((city, index) => (
                                            <div
                                                key={index}
                                                onClick={() => selectCity(city.city, true)}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{city.city}</div>
                                                <div className="text-xs text-gray-500">{city.country}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Destination Input with Autocomplete */}
                            <div className="relative" ref={destinationRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="text"
                                    name="to"
                                    value={formData.to}
                                    onChange={handleChange}
                                    onFocus={() => formData.to.length >= 2 && setShowDestinationDropdown(true)}
                                    placeholder="Destination City"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-3 outline-none text-gray-800"
                                    autoComplete="off"
                                    required
                                />
                                {showDestinationDropdown && destinationSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                        {destinationSuggestions.map((city, index) => (
                                            <div
                                                key={index}
                                                onClick={() => selectCity(city.city, false)}
                                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{city.city}</div>
                                                <div className="text-xs text-gray-500">{city.country}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

                            {formData.tripType === "round" && (
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
                                    />
                                </div>
                            )}
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
                                    key={flight.flight_id}
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
                                                <p className="text-sm text-gray-500">{flight.flight_id}</p>
                                                <p className="text-sm text-gray-600">{flight.cabin_class}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 text-center">
                                            <p className="font-medium text-lg">
                                                {new Date(flight.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                {flight.arrival_datetime && (
                                                    <> → {new Date(flight.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">{flight.flight_duration ? `${flight.flight_duration} hrs` : 'N/A'}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {flight.departure_city_code} → {flight.arrival_city_code}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {flight.origin_country} → {flight.destination_country}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-blue-600">
                                                GHS {flight.price}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-1">per person</p>
                                            <p className="text-xs text-gray-400 mb-3">{flight.seats_available} seats left</p>
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

            {!showResults && flights.length > 0 && (
                <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-2xl font-bold mb-2 text-gray-800">
                            Available Flights
                        </h3>
                        <p className="text-gray-600">
                            {flights.length} flight{flights.length !== 1 ? 's' : ''} available
                        </p>
                    </div>

                    <div className="space-y-4">
                        {flights.map((flight) => (
                            <div
                                key={flight.flight_id}
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
                                            <p className="text-sm text-gray-500">{flight.flight_id}</p>
                                            <p className="text-sm text-gray-600">{flight.cabin_class}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <p className="font-medium text-lg">
                                            {new Date(flight.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            {flight.arrival_datetime && (
                                                <> → {new Date(flight.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">{flight.flight_duration ? `${flight.flight_duration} hrs` : 'N/A'}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {flight.departure_city_code} → {flight.arrival_city_code}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {flight.origin_country} → {flight.destination_country}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">
                                            GHS {flight.price}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-1">per person</p>
                                        <p className="text-xs text-gray-400 mb-3">{flight.seats_available} seats left</p>
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
                </div>
            )}

            <Footer />
        </div>
    );
};

export default UserDashboard;
