import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import api from '../api/axios';

const Packages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await api.get('/packages');
            setPackages(response.data);
        } catch (err) {
            setError('Failed to load packages');
            console.error('Error fetching packages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBookPackage = (packageId) => {
        // Navigate to booking page or show booking modal
        alert(`Booking package ${packageId} - Feature coming soon!`);
    };

    if (loading) {
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Travel Packages</h1>
                    <p className="text-xl mb-8">Discover amazing destinations with our curated travel packages</p>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="container mx-auto px-4 py-12">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <img 
                                src={pkg.image} 
                                alt={pkg.name}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                                <p className="text-gray-600 mb-4">{pkg.description}</p>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500">Duration:</span>
                                        <span className="font-medium">{pkg.duration}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500">Rating:</span>
                                        <div className="flex items-center">
                                            <span className="text-yellow-500">★</span>
                                            <span className="ml-1">{pkg.rating}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">Includes:</h4>
                                    <ul className="text-sm text-gray-600">
                                        {pkg.includes.map((item, index) => (
                                            <li key={index} className="flex items-center mb-1">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-2xl font-bold text-blue-600">
                                            ${pkg.price}
                                        </span>
                                        <span className="text-gray-500 ml-1">/{pkg.currency}</span>
                                    </div>
                                    <button
                                        onClick={() => handleBookPackage(pkg.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {packages.length === 0 && !loading && !error && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No packages available at the moment.</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Packages;
