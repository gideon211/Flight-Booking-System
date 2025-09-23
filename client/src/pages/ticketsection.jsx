import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const TicketSection = () => {
  const navigate = useNavigate();  
  const [tickets, setTickets] = useState([
    
    {
      id: 1,
      pnr: "ABC123",
      passenger: "Claudia",
      flight: "Accra → London",
      airline: "Africa World Airlines",
      airlineLogo:
        "https://cdn.24.co.za/files/Cms/General/d/3224/77e658b123ec45b880e1fa6ec1186274.jpg",
      date: "2025-10-01",
      seat: "12A",
      departureTime: "09:00",
      arrivalTime: "15:00",
      duration: "6h",
      price: 2500,
      status: "Confirmed",
      baggage: "2 bags (23kg each)",
      gate: "B12",
    },
    {
      id: 2,
      pnr: "XYZ789",
      passenger: "Gordon",
      flight: "London → New York",
      airline: "British Airways",
      airlineLogo:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iV8_TH5FVHmM/v1/1200x800.jpg",
      date: "2024-11-12",
      seat: "7C",
      departureTime: "18:00",
      arrivalTime: "23:30",
      duration: "7h 30m",
      price: 4500,
      status: "Completed",
      baggage: "1 bag (30kg)",
      gate: "A05",
    },
    {
      id: 3,
      pnr: "XYZ789",
      passenger: "Gordon",
      flight: "London → New York",
      airline: "British Airways",
      airlineLogo:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iV8_TH5FVHmM/v1/1200x800.jpg",
      date: "2024-11-12",
      seat: "7C",
      departureTime: "18:00",
      arrivalTime: "23:30",
      duration: "7h 30m",
      price: 4500,
      status: "Completed",
      baggage: "1 bag (30kg)",
      gate: "A05",
    },
        {
      id: 4,
      pnr: "XYZ789",
      passenger: "Gordon",
      flight: "London → New York",
      airline: "British Airways",
      airlineLogo:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iV8_TH5FVHmM/v1/1200x800.jpg",
      date: "2024-11-12",
      seat: "7C",
      departureTime: "18:00",
      arrivalTime: "23:30",
      duration: "7h 30m",
      price: 4500,
      status: "Completed",
      baggage: "1 bag (30kg)",
      gate: "A05",
    },
    {
      id: 5,
      pnr: "XYZ789",
      passenger: "Gordon",
      flight: "London → New York",
      airline: "British Airways",
      airlineLogo:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iV8_TH5FVHmM/v1/1200x800.jpg",
      date: "2025-11-12",
      seat: "7C",
      departureTime: "18:00",
      arrivalTime: "23:30",
      duration: "7h 30m",
      price: 4500,
      status: "Confirmed",
      baggage: "1 bag (30kg)",
      gate: "A05",
    },
  ]);

  const [activeTab, setActiveTab] = useState("upcoming");

  const today = new Date();
  const upcomingFlights = tickets.filter((t) => new Date(t.date) >= today);
  const pastFlights = tickets.filter((t) => new Date(t.date) < today);

  const handleCancelTicket = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: "Cancelled" } : t
      )
    );
  };



  const handleDownload = (ticket) => {
    alert(`Downloading ticket PDF for ${ticket.pnr}...`);
  };

  const handlePrint = (ticket) => {
    window.print();
  };

  const handleRebook = (ticket) => {
    alert(`Rebooking flight ${ticket.flight} for passenger ${ticket.passenger}...`);
  };

  const handleRate = (ticket) => {
    const rating = prompt(`Rate your experience on ${ticket.flight} (1-5):`);
    if (rating) alert(`Thanks! You rated this flight ${rating}/5`);
  };

  const renderTicketCard = (ticket, isPast = false) => (
    <div key={ticket.id} className="flex flex-col md:flex-row justify-between p-4 items-center bg-white  shadow-blue-100 border border-blue-100 mb-4 hover:shadow-lg transition-transform transform hover:scale-101">
        <div className="flex items-center gap-3 w-full md:w-auto">
            <img
                src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                alt={ticket.airline}
                className="w-32 h- md:w-40 md:h-40 object-cover"
            />
            <div className="flex flex-col w-full">
                <p className="font-medium text-left">{ticket.airline}</p>
                <p className="text-sm text-gray-500">{ticket.flight}</p>
                <p className="text-sm text-gray-500">Seat {ticket.seat}</p>
                <p className="text-sm font-semibold text-gray-700">Ref: {ticket.pnr}</p>
                <p className="text-sm text-gray-600">Passenger: {ticket.passenger}</p>
            </div>
        </div>


      <div className="text-center w-full md:w-auto mt-4 md:mt-0 ">
            <p className="font-medium">{ticket.departureTime} → {ticket.arrivalTime}</p>
            <p className="text-sm text-gray-500">{ticket.duration}</p>
            <p className="text-sm text-gray-600">{ticket.date}</p>
            <p className="text-sm text-gray-600">Gate: {ticket.gate}</p>
            <p className="text-sm text-gray-600">Baggage: {ticket.baggage}</p>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${ticket.status === "Confirmed" ? "bg-green-100 text-green-700" : ticket.status === "Checked-in" ? "bg-blue-100 text-blue-700" : ticket.status === "Completed" ? "bg-gray-200 text-gray-700" : "bg-red-100 text-red-700"}`}>{ticket.status}</span>
      </div>

            <div className="text-right w-full md:w-1/3 mt-4 md:mt-0">
            <p className="text-red-500 font-medium">GHS {ticket.price}</p>
            <div className="grid grid-cols gap-2 mt-2 justify-end">
            {!isPast && (
            <>
                <button
                onClick={() => handleDownload(ticket)}
                className="px-3 py-1 bg-yellow-500 text-white hover:bg-yellow-600 text-sm cursor-pointer"
                >
                Download
                </button>
                <button
                onClick={() => handlePrint(ticket)}
                className="px-3 py-1 bg-gray-400 text-white hover:bg-gray-600 text-sm cursor-pointer"
                >
                Print
                </button>
                {ticket.status !== "Cancelled" && (
                <button
                    onClick={() => handleCancelTicket(ticket.id)}
                    className="px-3 py-1 bg-red-400 text-white  hover:bg-red-600 text-sm cursor-pointer"
                >
                    Cancel Ticket
                </button>
                )}
            </>
            )}

            {isPast && (
            <>
                <button
                onClick={() => handleRebook(ticket)}
                className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 text-sm cursor-pointer"
                >
                Rebook
                </button>
                <button
                onClick={() => handleRate(ticket)}
                className="px-3 py-1 bg-purple-500 text-white hover:bg-purple-600 text-sm cursor-pointer"
                >
                Rate
                </button>
            </>
            )}
        </div>
        </div>

    </div>
  );

  return (
    <div className="bg-white min-h-screen p-6 relative bg-opacity-50">
        <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900 cursor-pointer "
      >
        <FiArrowLeft size={24} />
        <span className="font-medium">Back to Home</span>  
      </button>
    {/* <div className="absolute inset-0 bg-blue-100 opacity-50"></div> */}
      {/* <h2 className="text-2xl font-semibold mb-6 text-center">Your Flights</h2> */}
      <div className="flex gap-2 mb-6 justify-center w">
        <button
          className={` py-4 px-9 cursor-pointer rounded-full font-medium transition-colors ${activeTab === "upcoming" ? "bg-yellow-500 text-white" : "bg-yellow-100 text-back hover:bg-yellow-200"}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Flights
        </button>
        <button
          className={`px-9 py-4 cursor-pointer rounded-full font-medium transition-colors ${activeTab === "past" ? "bg-yellow-500 text-white" : "bg-yellow-100 text-back hover:bg-yellow-200"}`}
          onClick={() => setActiveTab("past")}
        >
          Past Flights
        </button>
      </div>

      {/* Flight Lists */}
      <div className="max-w-4xl mx-auto">
        {activeTab === "upcoming" && (upcomingFlights.length ? upcomingFlights.map(ticket => renderTicketCard(ticket)) : <p className="text-gray-500">No upcoming flights.</p>)}
        {activeTab === "past" && (pastFlights.length ? pastFlights.map(ticket => renderTicketCard(ticket, true)) : <p className="text-gray-500">No past flights.</p>)}
      </div>
    </div>
  );
};

export default TicketSection;
