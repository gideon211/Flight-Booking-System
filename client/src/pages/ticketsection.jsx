import React, { useState } from "react";

const TicketSection = () => {
  const [tickets, setTickets] = useState([
    {
      id: 1,
      flight: "Accra → London",
      airline: "Africa World Airlines",
      date: "2025-10-01",
      seat: "12A",
      departureTime: "09:00",
      arrivalTime: "15:00",
      duration: "6h",
      price: 2500,
    },
    {
      id: 2,
      flight: "London → New York",
      airline: "British Airways",
      date: "2025-11-12",
      seat: "7C",
      departureTime: "18:00",
      arrivalTime: "23:30",
      duration: "7h 30m",
      price: 4500,
    },
  ]);

  const handleCancelTicket = (ticketId) => {
    setTickets(tickets.filter((t) => t.id !== ticketId));
  };

  const handleViewDetails = (ticket) => {
    alert(
      `Flight: ${ticket.flight}\nAirline: ${ticket.airline}\nDate: ${ticket.date}\nSeat: ${ticket.seat}\nTime: ${ticket.departureTime} → ${ticket.arrivalTime}`
    );
  };

  return (
    <div className="bg-blue-50 min-h-screen p-6 flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-6">My Tickets</h2>

      {tickets.length === 0 ? (
        <p className="text-gray-500">No tickets booked yet.</p>
      ) : (
        <div className="space-y-4 w-full max-w-3xl">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg"
            >

              <div className="flex items-center gap-3">
                <img
                  src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                  alt={ticket.airline}
                  className="w-20 h-20 object-cover"
                />
                <div>
                  <p className="font-medium text-lg">{ticket.airline}</p>
                  <p className="text-sm text-gray-500">{ticket.flight}</p>
                  <p className="text-sm text-gray-500">Seat {ticket.seat}</p>
                </div>
              </div>


              <div className="text-center">
                <p className="font-medium">
                  {ticket.departureTime} → {ticket.arrivalTime}
                </p>
                <p className="text-sm text-gray-500">{ticket.duration}</p>
                <p className="text-sm text-gray-600">{ticket.date}</p>
              </div>


              <div className="text-right">
                    <p className="text-blue-500 font-medium">
                    GHS {ticket.price}
                    </p>
                    <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => handleViewDetails(ticket)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        View
                    </button>
                    <button
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Cancel
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketSection;
