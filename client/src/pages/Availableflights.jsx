import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AvailableFlights = () => {
  const location = useLocation();
  const results = location.state?.results || [];
  const navigate = useNavigate();

  const from = location.state?.from ?? "";
  const to = location.state?.to ?? "";
  const passengers = location.state?.passengers || "1";
  const cabin = location.state?.cabin || "Economy";

  const handleSelect = (flight) => {
    navigate(`/itinerary/${flight.flightId}`, { state: { flight } });
  };

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white shadow rounded p-6 flex justify-between items-center mx-6 mt-6">
        <div>
          <p className="font-medium text-2xl">
            {from.toUpperCase()} → {to.toUpperCase()}
          </p>
          <p className="text-sm">Available Flights</p>
        </div>
        <button
          onClick={() => navigate("/Home")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-semibold shadow cursor-pointer"
        >
          Modify Search
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 p-6 gap-6">
        {/* Sidebar Filters */}
        <aside className="w-1/4 bg-white p-6 shadow-md rounded-md">
          <h3 className="font-semibold text-lg mb-4">Filters</h3>

          <h4 className="font-medium mb-2">Stops</h4>
          <div className="flex gap-2 mb-6">
            <button className="px-3 py-2 bg-yellow-500 text-black rounded">Direct</button>
            <button className="px-3 py-2 bg-gray-200 text-gray-500 rounded" disabled>
              1 Stop
            </button>
          </div>

          <h4 className="font-medium mb-2">Fare Type</h4>
          <label className="block mb-1">
            <input type="checkbox" className="mr-2" /> Refundable
          </label>
          <label className="block mb-6">
            <input type="checkbox" className="mr-2" /> Non Refundable
          </label>

          <h4 className="font-medium mb-2">Airlines</h4>
          <label className="block mb-6">
            <input type="checkbox" defaultChecked className="mr-2" /> Africa World Airlines
          </label>

          <h4 className="font-medium mb-2">Price</h4>
          <input type="range" min="300" max="3000" className="w-full" />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>GHS 300</span>
            <span>GHS 3000</span>
          </div>
        </aside>

        {/* Flight Results */}
        <main className="flex-1">
          {results.length > 0 ? (
            <div className="space-y-4 max-w-2/3">
              {results.map((flight) => (
                <div
                  key={flight.flightId}
                  className="flex justify-between items-center bg-white p-4"
                >
                  {/* Airline */}
                  <div className="flex items-center gap-3">
                    <img
                      src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                      alt={flight.airline}
                      className="w-20 h-20 object-cover "
                    />
                    <div>
                      <p className="font-medium text-lg">{flight.airline}</p>
                      <p className="text-sm text-gray-500">{flight.cabin}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-center">
                    <p className="font-medium">
                      {flight.departureTime} → {flight.arrivalTime}
                    </p>
                    <p className="text-sm text-gray-500">{flight.duration}</p>
                  </div>

                  {/* Price + Action */}
                  <div className="text-right">
                    <p className="text- font-medium text-blue-600">GHS {flight.price}</p>
                    <button
                      onClick={() => handleSelect(flight)}
                      className="mt-2 bg-yellow-500 text-black px-5 py-2 rounded-md font-medium hover:bg-yellow-600 shadow cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 shadow-md rounded text-center">
              <p>No flights found.</p>
              <Link to="/" className="text-blue-600 font-medium">
                Back to search
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvailableFlights;
