import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AvailableFlights = () => {
   const location = useLocation();
   const results = location.state?.results || [];
   const navigate = useNavigate();

   const from = location.state?.from ?? "";
   const to = location.state?.to ?? "";


  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelect = (flight) => {
    navigate(`/itinerary/${flight.flight_id}`, { state: { flight } });
  };

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col">
      <Navbar />

   
      <div className="bg-gradient-to-r from-blue-400 to-blue-300 text-white shadow rounded p-6 flex justify-between items-center mx-6 mt-6">
            <div>
                <p className="font-medium text-2xl">
                    {from.toUpperCase()} → {to.toUpperCase()}
                </p>
                <p className="text-sm">Available Flights</p>
            </div>
            <button
            onClick={() => navigate("/")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-semibold shadow cursor-pointer"
            >
            Modify Search
            </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row p-4 md:p-6 gap-6 flex-1">
        {/* Mobile Sidebar Toggle */}
        <button
          className="lg:hidden mb-4 bg-blue-400 text-white px-4 py-2 rounded-md w-full text-left"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Sidebar */}
        <aside
          className={`bg-white p-6 shadow-md rounded-md flex-shrink-0 w-full lg:w-1/4 transition-all duration-300 ${
            sidebarOpen ? "block" : "hidden lg:block"
          }`}
        >
          <h3 className="font-semibold text-lg mb-4">Filters</h3>

          <h4 className="font-medium mb-2">Stops</h4>
          <div className="flex gap-2 mb-6 flex-wrap">
            <button className="px-3 py-2 bg-yellow-500 text-black rounded text-sm">Direct</button>
            <button className="px-3 py-2 bg-gray-200 text-gray-500 rounded text-sm" disabled>
              1 Stop
            </button>
          </div>

          <h4 className="font-medium mb-2">Fare Type</h4>
          <label className="block mb-1 text-sm">
            <input type="checkbox" className="mr-2" /> Refundable
          </label>
          <label className="block mb-6 text-sm">
            <input type="checkbox" className="mr-2" /> Non Refundable
          </label>

          <h4 className="font-medium mb-2">Airlines</h4>
          <label className="block mb-6 text-sm">
            <input type="checkbox" defaultChecked className="mr-2" /> Africa World Airlines
          </label>

          <h4 className="font-medium mb-2">Price</h4>
          <input type="range" min="300" max="3000" className="w-full" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>GHS 300</span>
            <span>GHS 3000</span>
          </div>
        </aside>

        {/* Flights Section */}
        <main className="flex-1">
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((flight) => (
                <div
                  key={flight.flight_id}
                  className="flex flex-col sm:flex-row justify-between items-center bg-white p-4  shadow-md gap-4"
                >
                  {/* Flight Info */}
                  <div className="flex items-center gap-3 min-w-[150px] flex-shrink-0 w-full sm:w-auto">
                    <img
                      src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                      alt={flight.airline}
                      className="w-full sm:w-24 h-24 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lg truncate">{flight.airline}</p>
                      <p className="text-sm text-gray-500 truncate">{flight.cabin_class}</p>
                      <p className="text-xs text-gray-400 truncate">{flight.flight_id}</p>
                    </div>
                  </div>

                  {/* Time & Duration (hidden on mobile) */}
                  <div className="text-center flex-1 mt-2 sm:mt-0 hidden sm:block">
                    <p className="font-medium text-sm sm:text-base">
                      {new Date(flight.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {flight.arrival_datetime && (
                        <> → {new Date(flight.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{flight.flight_duration ? `${flight.flight_duration} hrs` : 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {flight.departure_city_code} → {flight.arrival_city_code}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="text-center sm:text-right flex-shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                    <p className="font-medium text-blue-600 hidden sm:block">GHS {flight.price}</p>
                    <p className="text-xs text-gray-400 hidden sm:block mb-2">{flight.seats_available} seats left</p>
                    <button
                      onClick={() => handleSelect(flight)}
                      className="mt-2 bg-yellow-500 text-black px-5 py-2 rounded-md font-medium hover:bg-yellow-600 shadow cursor-pointer w-full sm:w-auto"
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

      <Footer />
    </div>
  );
};

export default AvailableFlights;
