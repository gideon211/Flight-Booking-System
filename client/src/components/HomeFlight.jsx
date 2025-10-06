import React, { useState, useEffect } from "react";
import Arrow from "../assets/arrow-right-solid-full.svg";
import { useNavigate } from "react-router-dom";

const HomeFlight = () => {
  const [flights, setFlights] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/flights.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch flights.json");
        }
        return res.json();
      })
      .then((data) => setFlights(data))
      .catch((err) => {
        console.error("Error loading flights:", err);
      });
  }, []);

  const handleBook = (flight) => {
    navigate("/Availableflights", {
      state: { flight },
    });
  };

  return (
    <div className="bg-blue-100 px-4 sm:px-6 md:px-8 py-10">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
          Popular Africa World Airlines Flights
        </h1>
        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
          Enjoy a wide network of routes and a commitment to excellence. <br className="hidden sm:block" />
          <span className="text-sm sm:text-base">
            Africa World Airlines is the perfect choice for your next trip.
          </span>
        </p>
      </div>

      {/* Flights Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {flights.slice(0, 10).map((flight) => (
          <div
            key={flight.flightId}
            className="flex flex-col md:flex-row w-full bg-white shadow-sm overflow-hidden hover:shadow-xl transition"
          >
            {/* Flight Image */}
            <div className="w-full md:w-40 h-20 md:h-auto">
              <img
                className="w-full h-full object-cover"
                src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                alt="Flight"
              />
            </div>

            {/* Flight Info */}
            <div className="flex flex-1 flex-col md:flex-row justify-between items-center md:items-start px-4 py-3 gap-4">
              <div className="text-center md:text-left">
                <h2 className="flex items-center justify-center md:justify-start gap-2 font-medium text-lg sm:text-xl">
                  {flight.origin.city}
                  <img src={Arrow} className="w-5 sm:w-6" alt="to" />
                  {flight.destination.city}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Airline: {flight.airline}
                </p>
              </div>

              <div className="text-center">
                <span className="font-semibold text-blue-500 block mb-2 text-sm sm:text-base">
                  GHS {flight.price}
                </span>
                <button
                  onClick={() => handleBook(flight)}
                  className="bg-yellow-500 text-black text-sm sm:text-base font-medium py-2 px-4 sm:px-6 rounded-md hover:bg-yellow-600 transition"
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl mx-auto text-center mt-8 px-2">
        <p className="text-xs sm:text-sm text-gray-700">
          *Fares displayed above are inclusive of taxes & fees, based on historical data,
          are subject to change and cannot be guaranteed at the time of booking.
          See all booking terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default HomeFlight;
