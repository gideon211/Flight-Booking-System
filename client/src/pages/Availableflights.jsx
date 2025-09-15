import React from "react";
import { useLocation, Link } from "react-router-dom";
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import Flight from "../assets/flights.svg";

const AvailableFlights = () => {
  const location = useLocation();
  const results = location.state?.results || [];

  // Extract the search details
const from = location.state?.from || "ACCRA";
const to = location.state?.to || "KUMASI";
const date = location.state?.date || "—";
const passengers = location.state?.passengers || "1 Adult";
const cabin = location.state?.cabin || "Economy";

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between px-8 items-center h-[5rem] bg-white shadow-md">
        <div className="h-6 flex items-center">
          <img
            src="https://cdn.travelwings.com/web-assets/images/travelwings-logo.svg"
            alt="logo"
            className="w-64"
          />
        </div>

        <ul className="flex gap-6 items-center">
          <div className="flex mr-10">
            <li className="w-7 cursor-pointer flex gap-1">
              <img src={Flight} alt="Home" />
              <p>Flights</p>
            </li>
          </div>

          <li className="w-7 cursor-pointer">
            <img src={Build} alt="Building" />
          </li>
          <li className="w-7 cursor-pointer">
            <img src={Cart} alt="Cart" />
          </li>
          <li className="w-7 cursor-pointer">
            <img src={Boat} alt="Boat" />
          </li>
          <li className="w-7 cursor-pointer">
            <img src={Umbrella} alt="Umbrella" />
          </li>
          <li className="w-7 cursor-pointer">
            <img src={Car} alt="Car" />
          </li>
        </ul>
      </nav>

      {/* Main Layout */}
      <div className="flex p-6 gap-6">
        {/* Sidebar Filters */}
        <aside className="w-1/4 bg-white p-4 shadow rounded">
          <h3 className="font-medium text-2xl mb-3">No. of Stops</h3>
          <div className="space-x-2 mb-4">
            <button className="px-4 py-7 border rounded bg-red-600 text-white">
              Direct
            </button>
            <button className="px-5 py-7 border rounded bg-gray-300 text-gray-500" disabled>
              1 Stop
            </button>
            <button className="px-4 py-7 border rounded bg-gray-300 text-gray-500" disabled>
              2+ Stops
            </button>
          </div>

          <h3 className="font-medium mt-4 mb-3">Timing From: Accra</h3>
          <div className="grid grid-cols-4 text-xs mb-4 text-center">
            <div className="flex flex-col">
              <span>🌅</span>
              <span>03:00-09:00</span>
            </div>
            <div className="flex flex-col">
              <span>☀️</span>
              <span>09:00-15:00</span>
            </div>
            <div className="flex flex-col">
              <span>🌆</span>
              <span>15:00-21:00</span>
            </div>
            <div className="flex flex-col">
              <span>🌙</span>
              <span>21:00-03:00</span>
            </div>
          </div>

          <h3 className="font-bold mb-3">Fare Type</h3>
          <div className="mb-4">
            <label className="block">
              <input type="checkbox" /> Refundable
            </label>
            <label className="block">
              <input type="checkbox" /> Non Refundable
            </label>
          </div>

          <h3 className="font-bold mb-3">Airlines</h3>
          <div className="mb-4">
            <label className="block">
              <input type="checkbox" defaultChecked /> Africa World Airlines
            </label>
          </div>

          <h3 className="font-bold mb-3">Price</h3>
          <input type="range" min="3000" max="4000" className="w-full" />
          <div className="flex justify-between text-sm">
            <span>GHS 500</span>
            <span>GHS 3,158</span>
          </div>
        </aside>

        {/* Flight Results */}
        <main className="w-3/4">

          <div className="bg-gradient-to-r from-red-400 to-red-200 text-white shadow rounded p-4 mb-4 flex justify-between">
            <div className="h-30 justify-center ">
              <p className="font-medium  text-2xl mt-10 text-white ">{from.toUpperCase()} → {to.toUpperCase()}</p>
              <p>{date} | {passengers} | {cabin}</p>
            </div>
            <button className="border px-12 py-1 rounded border-none bg-red-400 text-xl text-white cursor-pointer hover:bg-red-500">Modify</button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((flight) => (
                <div
                  key={flight.flightId}
                  className="flex justify-between items-center bg-white p-4 shadow rounded w-2/3"
                >

                  {/* Airline Info */}

                  <div className="flex items-center gap-2">
                        <div className="w-40 h-full">
                            <img
                            className="w-full h-full object-cover rounded-l-md" 
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZZznTuZkcFKT0Uj5q9FELohRI2bdci6rGOQ&s" 
                            alt="" 
                            />
                        </div>


                        <div>
                            <p className="font-medium text-xl">{flight.airline}</p>
                            <p className="text-sm text-gray-500">{flight.cabin}</p>
                        </div>
                  </div>

                  {/* Time & Duration */}
                  <div className="text-center flex flex-col">
                        <div className="flex items-baseline gap-12">
                            <p className="text-sm">{flight.departureTime}</p>
                            <p className="font-bold text-2xl leading-none">→</p>
                            <p className="text-sm">{flight.arrivalTime}</p>
                        </div>


                        <p className="text-sm text-gray-500">{flight.duration}</p>
                  </div>

                  {/* Price & Select */}
                  <div className="text-right">
                    <p className="text-xl font-medium text-gray-600">
                      GHS {flight.price}
                    </p>
                    <button className="mt-2 bg-red-500 text-white px-4 py-2 rounded shadow-2xl">
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 shadow rounded">
              <p>No flights found.</p>
              <Link to="/" className="text-blue-500">
                Back to search
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AvailableFlights;
