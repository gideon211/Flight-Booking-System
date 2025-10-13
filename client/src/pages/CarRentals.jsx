import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../api/axios';

const CarRentals = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        location: '',
        type: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCars();
    }, [filters]);

    const fetchCars = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.location) params.append('location', filters.location);
            if (filters.type) params.append('type', filters.type);
            
            const response = await api.get(`/car-rentals?${params.toString()}`);
            setCars(response.data);
        } catch (err) {
            setError('Failed to load car rentals');
            console.error('Error fetching car rentals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRentCar = (carId) => {
        // Navigate to booking page or show booking modal
        alert(`Renting car ${carId} - Feature coming soon!`);
    };

    if (loading && cars.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Car Rentals</h1>
                    <p className="text-xl mb-8">Find the perfect car for your journey</p>
                </div>
            </div>

            {/* Filters */}
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Filter Cars</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Location</label>
                            <select
                                name="location"
                                value={filters.location}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Locations</option>
                                <option value="Accra">Accra</option>
                                <option value="Kumasi">Kumasi</option>
                                <option value="Tamale">Tamale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Car Type</label>
                            <select
                                name="type"
                                value={filters.type}
                                onChange={handleFilterChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                                <option value="Hatchback">Hatchback</option>
                                <option value="Luxury">Luxury</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-end">
                            <button
                                onClick={() => setFilters({ location: '', type: '' })}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Cars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cars.map((car) => (
                        <div key={car.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src={car.image} 
                                alt={`${car.brand} ${car.model}`}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold">{car.brand} {car.model}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        car.available 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {car.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                
                                <div className="text-gray-600 mb-4">
                                    <p>{car.year} • {car.type} • {car.location}</p>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500">Rating:</span>
                                        <div className="flex items-center">
                                            <span className="text-yellow-500">★</span>
                                            <span className="ml-1">{car.rating}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Features:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {car.features.map((feature, index) => (
                                            <span 
                                                key={index}
                                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-2xl font-bold text-green-600">
                                            ${car.price_per_day}
                                        </span>
                                        <span className="text-gray-500 ml-1">/day</span>
                                    </div>
                                    <button
                                        onClick={() => handleRentCar(car.id)}
                                        disabled={!car.available}
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                            car.available
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {car.available ? 'Rent Now' : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {cars.length === 0 && !loading && !error && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No cars available with current filters.</p>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-8">
                        <Loader />
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default CarRentals;
