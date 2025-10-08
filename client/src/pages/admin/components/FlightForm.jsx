import React, { useState } from "react";
import api from "../../../api/axios";

const tripTypes = ["oneway", "round"];
const cabinClasses = ["Economy", "Premium", "Business", "First Class"];
const flightStatuses = ["active", "cancelled", "delayed"];

const FlightForm = () => {
    const [formData, setFormData] = useState({
        flight_id: "",
        trip_type: "oneway",
        airline: "",
        departure_city: "",
        arrival_city: "",
        departure_datetime: "",
        return_datetime: "",
        price: "",
        cabin_class: "Economy",
        seats_available: "",
        flight_status: "active",
        gate: "",
        terminal: "",
        baggage_allowance: "",
        flight_description: "",
        airline_logo: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        
        // Debug: Check user info
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("access_token");
        console.log("DEBUG: User from localStorage:", user);
        console.log("DEBUG: Token exists:", !!token);
        
        try {
            const response = await api.post("/admin/flights", formData);
            console.log("DEBUG: Success response:", response.data);
            setSuccess("Flight created successfully!");
            
            // Reset form after success
            setTimeout(() => {
                setFormData({
                    flight_id: "",
                    trip_type: "oneway",
                    airline: "",
                    departure_city: "",
                    arrival_city: "",
                    departure_datetime: "",
                    return_datetime: "",
                    price: "",
                    cabin_class: "Economy",
                    seats_available: "",
                    flight_status: "active",
                    gate: "",
                    terminal: "",
                    baggage_allowance: "",
                    flight_description: "",
                    airline_logo: "",
                });
                setSuccess("");
            }, 3000);
        } catch (err) {
            console.error("DEBUG: Full error:", err);
            console.error("DEBUG: Error response:", err.response);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to create flight";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6  ">
            <h2 className="text-2xl font-medium mb-4">Add New Flight</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {success && <p className="text-green-500 mb-2">{success}</p>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        name="flight_id" 
                        placeholder="Flight ID *" 
                        value={formData.flight_id} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <select 
                        name="trip_type" 
                        value={formData.trip_type} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0"
                    >
                        {tripTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <input 
                        name="airline" 
                        placeholder="Airline *" 
                        value={formData.airline} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <input 
                        name="departure_city" 
                        placeholder="Departure City *" 
                        value={formData.departure_city} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <input 
                        name="arrival_city" 
                        placeholder="Arrival City *" 
                        value={formData.arrival_city} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <input 
                        type="datetime-local" 
                        name="departure_datetime" 
                        value={formData.departure_datetime} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <input 
                        type="datetime-local" 
                        name="return_datetime" 
                        value={formData.return_datetime} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                    />
                    <input 
                        type="number" 
                        name="price" 
                        placeholder="Price *" 
                        value={formData.price} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <select 
                        name="cabin_class" 
                        value={formData.cabin_class} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0"
                    >
                        {cabinClasses.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                    <input 
                        type="number" 
                        name="seats_available" 
                        placeholder="Seats Available *" 
                        value={formData.seats_available} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                        required 
                    />
                    <select 
                        name="flight_status" 
                        value={formData.flight_status} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0"
                    >
                        {flightStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input 
                        name="gate" 
                        placeholder="Gate" 
                        value={formData.gate} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                    />
                    <input 
                        name="terminal" 
                        placeholder="Terminal" 
                        value={formData.terminal} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                    />
                    <input 
                        name="baggage_allowance" 
                        placeholder="Baggage Allowance" 
                        value={formData.baggage_allowance} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0" 
                    />
                    <input 
                        name="flight_description" 
                        placeholder="Flight Description" 
                        value={formData.flight_description} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-0 md:col-span-2" 
                    />
                    <input 
                        name="airline_logo" 
                        placeholder="Airline Logo URL" 
                        value={formData.airline_logo} 
                        onChange={handleChange} 
                        className="border-2 p-2 border-blue-200 rounded outline-none" 
                    />
                </div>
                <button 
                    type="submit" 
                    className="bg-blue-500 rounded text-white py-3 px-8 cursor-pointer font-medium hover:bg-blue-600 flex mx-auto mt-6" 
                    disabled={loading}
                >
                    {loading ? "Creating Flight..." : "Create Flight"}
                </button>
            </form>
        
        </div>
    );
};

export default FlightForm;
