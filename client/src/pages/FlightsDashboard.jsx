import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faCalendar, faClock, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

const FlightsDashboard = () => {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllFlights();
    }, []);

    const fetchAllFlights = async () => {
        try {
            setLoading(true);
            const response = await api.get("/flights");
            setFlights(response.data);
        } catch (err) {
            setError("Failed to load flights");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">All Available Flights</h1>
                    <p className="text-gray-600">Browse and book from our complete flight schedule</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                ) : flights.length === 0 ? (
                    <div className="text-center py-16">
                        <FontAwesomeIcon icon={faPlane} className="text-gray-300 text-6xl mb-4" />
                        <p className="text-gray-500 text-xl">No flights available at the moment</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flights.map((flight) => (
                            <div
                                key={flight.flight_id}
                                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold">{flight.airline}</h3>
                                        <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                                            {flight.flight_id}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Route */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-center">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-500 mb-1" />
                                            <p className="text-lg font-bold text-gray-800">{flight.departure_city_code}</p>
                                            <p className="text-xs text-gray-500">{flight.origin_country}</p>
                                        </div>
                                        <div className="flex-1 mx-4">
                                            <FontAwesomeIcon icon={faPlane} className="text-gray-400" />
                                            <div className="border-t-2 border-dashed border-gray-300 mt-1"></div>
                                        </div>
                                        <div className="text-center">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500 mb-1" />
                                            <p className="text-lg font-bold text-gray-800">{flight.arrival_city_code}</p>
                                            <p className="text-xs text-gray-500">{flight.destination_country}</p>
                                        </div>
                                    </div>

                                    {/* Departure Time */}
                                    <div className="mb-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <FontAwesomeIcon icon={faCalendar} className="mr-2 text-blue-500" />
                                            <span>{formatDate(flight.departure_datetime)}</span>
                                        </div>
                                    </div>

                                    {/* Flight Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Duration</p>
                                            <p className="font-semibold text-gray-800">
                                                <FontAwesomeIcon icon={faClock} className="mr-1 text-blue-500" />
                                                {flight.flight_duration ? `${flight.flight_duration}h` : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Distance</p>
                                            <p className="font-semibold text-gray-800">
                                                {flight.flight_distance ? `${flight.flight_distance} km` : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Class</p>
                                            <p className="font-semibold text-gray-800">{flight.cabin_class}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Seats</p>
                                            <p className="font-semibold text-gray-800">{flight.seats_available} left</p>
                                        </div>
                                    </div>

                                    {/* Price and Book Button */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div>
                                            <p className="text-xs text-gray-500">Price from</p>
                                            <p className="text-2xl font-bold text-blue-600">GHS {flight.price}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/itinerary/${flight.flight_id}`, { 
                                                state: { 
                                                    flight,
                                                    from: flight.departure_city_code,
                                                    to: flight.arrival_city_code
                                                } 
                                            })}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightsDashboard;
