import React, { useState } from "react";


const tripTypes = ["OneWay", "RoundTrip", "MultiCity"];
const cabinClasses = ["Economy", "Premium", "Business", "First Class"];
const flightStatuses = ["Scheduled", "Delayed", "Cancelled"];
const mealOptionsList = ["Veg", "Non-Veg", "Special Meals"];

const FlightForm = () => {
    const [formData, setFormData] = useState({
        flightId: "",
        tripType: "OneWay",
        airline: "",
        origin: { code: "", city: "" },
        destination: { code: "", city: "" },
        departureDateTime: "",
        returnDateTime: "",
        price: "",
        cabinClass: "Economy",
        seatsAvailable: "",
        flightStatus: "Scheduled",
        gate: "",
        terminal: "",
        baggageAllowance: "",
        mealOptions: [],
        seatMap: { previewUrl: "", lockedSeats: [] },
        discountCodes: [],
        flightDescription: "",
        airlineLogo: "",
        flightFrequency: "",
        tags: [],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
        } else {
              setFormData({ ...formData, [name]: value });
            }
    };

    const handleCheckbox = (meal) => {
        const meals = formData.mealOptions.includes(meal)
        ? formData.mealOptions.filter((m) => m !== meal)
        : [...formData.mealOptions, meal];
        setFormData({ ...formData, mealOptions: meals });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await api.post("/admin/flights", formData);
            setSuccess("Flight created successfully!");
        } catch (err) {
         setError(err.response?.data?.message || "Failed to create flight");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6  ">
            <h2 className="text-2xl font-medium mb-4">Add New Flight</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {success && <p className="text-green-500 mb-2">{success}</p>}

            <form  onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input name="flightId" placeholder="Flight ID" value={formData.flightId} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0 " />
                    <select name="tripType" value={formData.tripType} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0 ">
                    {tripTypes.map((type) => <option key={type}>{type}</option>)}
                    </select>
                    <input name="airline" placeholder="Airline" value={formData.airline} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="origin.code" placeholder="Origin Code" value={formData.origin.code} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="origin.city" placeholder="Origin City" value={formData.origin.city} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="destination.code" placeholder="Destination Code" value={formData.destination.code} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="destination.city" placeholder="Destination City" value={formData.destination.city} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input type="datetime-local" name="departureDateTime" value={formData.departureDateTime} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input type="datetime-local" name="returnDateTime" value={formData.returnDateTime} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <select name="cabinClass" value={formData.cabinClass} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0">
                    {cabinClasses.map((cls) => <option key={cls}>{cls}</option>)}
                    </select>
                    <input type="number" name="seatsAvailable" placeholder="Seats Available" value={formData.seatsAvailable} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <select name="flightStatus" value={formData.flightStatus} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0">
                    {flightStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <input name="gate" placeholder="Gate" value={formData.gate} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="terminal" placeholder="Terminal" value={formData.terminal} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="baggageAllowance" placeholder="Baggage Allowance" value={formData.baggageAllowance} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />

                    <div className="col-span-2 flex space-x-4">
                        {mealOptionsList.map((meal) => (
                            <label key={meal} className="flex items-center space-x-1">
                                <input type="checkbox" checked={formData.mealOptions.includes(meal)} onChange={() => handleCheckbox(meal)} />
                                <span>{meal}</span>
                            </label>
                        ))}
                    </div>

                    <input name="seatMap.previewUrl" placeholder="Seat Map URL" value={formData.seatMap.previewUrl} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="flightDescription" placeholder="Flight Description" value={formData.flightDescription} onChange={handleChange} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="airlineLogo" placeholder="Airline Logo URL" value={formData.airlineLogo} onChange={handleChange} className="border-2 p-2 border-red-100 outline-none" />
                    <input name="flightFrequency" placeholder="Flight Frequency" value={formData.flightFrequency} onChange={handleChange} className="border-2 p-2 border-red-100 outline-none" />
                    <input name="tags" placeholder="Tags (comma separated)" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",") })} className="border-2 p-2 border-red-100 outline-0" />
                    <input name="discountCodes" placeholder="Discount Codes (comma separated)" value={formData.discountCodes} onChange={(e) => setFormData({ ...formData, discountCodes: e.target.value.split(",") })} className="border-2 p-2 border-red-100 outline-0" />
                

                </div>
                <button type="submit" className="bg-red-500 rounded text-white py-4 px-4 cursor-pointer font-medium hover:bg-red-600 flex mx-auto mt-2" disabled={loading}>
                {loading ? "Saving..." : "Create Flight"}
                </button>
            </form>
        
        </div>
    );
};

export default FlightForm;
