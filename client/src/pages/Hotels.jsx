import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api/axios";

const Hotels = () => {
    const [hotels, setHotels] = useState([]);
    const [filteredHotels, setFilteredHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(null);
    const [filters, setFilters] = useState({
        city: "",
        maxPrice: "",
        minRating: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const response = await api.get("/hotels");
            setHotels(response.data);
            setFilteredHotels(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching hotels:", error);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const applyFilters = () => {
        let filtered = hotels;

        if (filters.city) {
            filtered = filtered.filter(hotel => 
                hotel.city.toLowerCase().includes(filters.city.toLowerCase())
            );
        }

        if (filters.maxPrice) {
            filtered = filtered.filter(hotel => 
                hotel.price_per_night <= parseFloat(filters.maxPrice)
            );
        }

        if (filters.minRating) {
            filtered = filtered.filter(hotel => 
                hotel.rating >= parseInt(filters.minRating)
            );
        }

        setFilteredHotels(filtered);
    };

    const clearFilters = () => {
        setFilters({ city: "", maxPrice: "", minRating: "" });
        setFilteredHotels(hotels);
    };

    const renderStars = (rating) => {
        return "⭐".repeat(rating);
    };

    const handleBookHotel = async (hotel) => {
        try {
            setBookingLoading(hotel.id);
            
            // Check if user is logged in
            const userResponse = await api.get("/me");
            if (!userResponse.data.user) {
                navigate("/login");
                return;
            }

            // For now, navigate to a booking page or show success message
            // You can implement a proper booking flow here
            alert(`Booking ${hotel.name} for GHS ${hotel.price_per_night} per night. Booking functionality coming soon!`);
            
        } catch (error) {
            if (error.response?.status === 401) {
                navigate("/login");
            } else {
                console.error("Error booking hotel:", error);
                alert("Error booking hotel. Please try again.");
            }
        } finally {
            setBookingLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Loading hotels...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col">
            <Navbar />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Find Your Perfect Stay</h1>
                    <p className="text-blue-100">Browse through our selection of quality hotels</p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-6xl mx-auto w-full px-6 py-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Filter Hotels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={filters.city}
                                onChange={handleFilterChange}
                                placeholder="e.g., Accra"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (GHS)</label>
                            <input
                                type="number"
                                name="maxPrice"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                placeholder="e.g., 300"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                            <select
                                name="minRating"
                                value={filters.minRating}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none"
                            >
                                <option value="">Any</option>
                                <option value="3">3+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="5">5 Stars</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={applyFilters}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hotels Count */}
                <div className="mb-4">
                    <p className="text-gray-700 font-medium">
                        {filteredHotels.length} hotel{filteredHotels.length !== 1 ? "s" : ""} found
                    </p>
                </div>

                {/* Hotels Grid */}
                {filteredHotels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHotels.map((hotel) => (
                            <div
                                key={hotel.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                            >
                                <img
                                    src={hotel.image_url}
                                    alt={hotel.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {hotel.name}
                                        </h3>
                                        <span className="text-yellow-500 text-sm">
                                            {renderStars(hotel.rating)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        📍 {hotel.location}
                                    </p>
                                    <p className="text-sm text-gray-700 mb-3">
                                        {hotel.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {hotel.amenities.slice(0, 4).map((amenity, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                        {hotel.amenities.length > 4 && (
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                +{hotel.amenities.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t">
                                        <div>
                                            <p className="text-2xl font-bold text-blue-600">
                                                GHS {hotel.price_per_night}
                                            </p>
                                            <p className="text-xs text-gray-500">per night</p>
                                        </div>
                                        <button
                                            onClick={() => handleBookHotel(hotel)}
                                            disabled={bookingLoading === hotel.id}
                                            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-black px-4 py-2 rounded-lg font-medium transition"
                                        >
                                            {bookingLoading === hotel.id ? "Booking..." : "Book Now"}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {hotel.available_rooms} rooms available
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-600 text-lg mb-4">
                            No hotels found matching your criteria.
                        </p>
                        <button
                            onClick={clearFilters}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Hotels;
