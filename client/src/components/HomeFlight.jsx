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
        navigate("/flights-dashboard", {
            state: { flight },
        });
    };

    return (
        <div className="bg-blue-100 p-8">
            <div className="max-w-4xl mx-auto text-center py-6">
                <h1 className="text-4xl font-bold mb-2">
                Popular Africa World Airlines Flights
                </h1>
                <p className="text-md text-gray-800">
                Enjoy a wide network of routes and a commitment to excellence. <br />
                <span>Africa World Airlines is the perfect choice for your next trip.</span>
                </p>
            </div>

        
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {flights.slice(0, 10).map((flight) => (
                <div
                key={flight.flightId}
                className="flex w-full h-40 bg-white shadow-sm rounded-sm hover:shadow-2xl"
                >
                    
                    <div className="w-40 h-full">
                    <img
                    className="w-full h-full object-cover rounded-l-md"
                    src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                    alt=""
                    />
                    </div>

                
                    <div className="flex justify-between items-center px-6 flex-1">
                        <div>
                            <h2 className="flex items-center gap-2 font-medium text-xl">
                            {flight.origin.city}
                            <img src={Arrow} className="w-6" alt="" />
                            {flight.destination.city}
                            </h2>
                            <p className="text-sm">Airline: {flight.airline}</p>
                        </div>
                        <div className="text-center">
                            <span className="font-medium text-blue-500 block mb-2">
                            GHS {flight.price}
                            </span>
                            <button
                            onClick={() => handleBook(flight)}
                            className="bg-yellow-500 text-black font-medium py-2 px-6 rounded-sm hover:bg-yellow-600 cursor-pointer"
                            >
                            Book
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>

        
            <div className="max-w-4xl mx-auto text-center mt-6">
                <p className="text-sm text-white">
                *Fares displayed above are inclusive of taxes & fees, based on
                historical data, are subject to change and cannot be guaranteed at the
                time of booking. See all booking terms and conditions.
                </p>
            </div>
        </div>
    );
};

export default HomeFlight;
