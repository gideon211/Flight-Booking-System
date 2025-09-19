import { useState } from "react";
import api from "../api/axios"; // your axios instance

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
    flightDuration: "",
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
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value },
      });
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
      console.log(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create flight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Add New Flight</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
            <input
            name="flightId"
            placeholder="Flight ID"
            value={formData.flightId}
            onChange={handleChange}
            className="border p-2"
            />

            <select
            name="tripType"
            value={formData.tripType}
            onChange={handleChange}
            className="border p-2"
            >
            {tripTypes.map((type) => (
                <option key={type}>{type}</option>
            ))}
            </select>

            <input
            name="airline"
            placeholder="Airline"
            value={formData.airline}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="origin.code"
            placeholder="Origin Airport Code"
            value={formData.origin.code}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="origin.city"
            placeholder="Origin City"
            value={formData.origin.city}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="destination.code"
            placeholder="Destination Airport Code"
            value={formData.destination.code}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="destination.city"
            placeholder="Destination City"
            value={formData.destination.city}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="departureDateTime"
            type="datetime-local"
            placeholder="Departure Date & Time"
            value={formData.departureDateTime}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="returnDateTime"
            type="datetime-local"
            placeholder="Return Date & Time"
            value={formData.returnDateTime}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="price"
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            className="border p-2"
            />

            <select
            name="cabinClass"
            value={formData.cabinClass}
            onChange={handleChange}
            className="border p-2"
            >
            {cabinClasses.map((cls) => (
                <option key={cls}>{cls}</option>
            ))}
            </select>

            <input
            name="seatsAvailable"
            type="number"
            placeholder="Seats Available"
            value={formData.seatsAvailable}
            onChange={handleChange}
            className="border p-2"
            />

            <select
            name="flightStatus"
            value={formData.flightStatus}
            onChange={handleChange}
            className="border p-2"
            >
            {flightStatuses.map((status) => (
                <option key={status}>{status}</option>
            ))}
            </select>

            <input
            name="gate"
            placeholder="Gate"
            value={formData.gate}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="terminal"
            placeholder="Terminal"
            value={formData.terminal}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="baggageAllowance"
            placeholder="Baggage Allowance"
            value={formData.baggageAllowance}
            onChange={handleChange}
            className="border p-2"
            />

            <div className="flex space-x-3">
                {mealOptionsList.map((meal) => (
                    <label key={meal} className="flex items-center space-x-1">
                        <input
                            type="checkbox"
                            checked={formData.mealOptions.includes(meal)}
                            onChange={() => handleCheckbox(meal)}
                        />
                        <span>{meal}</span>
                    </label>
                ))}
            </div>

            <input
            name="flightDescription"
            placeholder="Flight Description"
            value={formData.flightDescription}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="airlineLogo"
            placeholder="Airline Logo URL"
            value={formData.airlineLogo}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="flightFrequency"
            placeholder="Flight Frequency"
            value={formData.flightFrequency}
            onChange={handleChange}
            className="border p-2"
            />

            <input
            name="tags"
            placeholder="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value.split(",") })
            }
            className="border p-2"
            />

            <button
            type="submit"
            className="bg-yellow-500 text-white p-2 font-semibold rounded"
            disabled={loading}
            >
            {loading ? "Saving..." : "Create Flight"}
            </button>
      </form>
    </div>
  );
};

export default FlightForm;
