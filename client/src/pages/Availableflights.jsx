import React from 'react'
import { useLocation, Link } from 'react-router-dom'

const Availableflights = () => {
    const location = useLocation();
    const results = location.state?.results || [];
  return (
    <div>
            <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Available Flights</h2>

      {results.length > 0 ? (
        results.map((flight) => (
          <div key={flight.flightId} className="p-4 mb-3 border rounded shadow">
            <p className="font-bold">{flight.airline}</p>
            <p>
              {flight.origin.city} ({flight.origin.code}) → {flight.destination.city} ({flight.destination.code})
            </p>
            <p>Departure: {flight.departureDate} {flight.departureTime}</p>
            {flight.tripType === "RoundTrip" && (
              <p>Return: {flight.returnDate}</p>
            )}
            <p>Cabin: {flight.cabin}</p>
            <p className="text-red-600 font-bold">GHS {flight.price}</p>
            <p>Seats Available: {flight.seatsAvailable}</p>
          </div>
        ))
      ) : (
        <p>No flights found.</p>
      )}

      <Link to="/" className="text-blue-500 underline">
        Back to search
      </Link>
    </div>
    </div>
  )
}

export default Availableflights