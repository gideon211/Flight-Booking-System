import React from 'react'
import { useState, useEffect } from 'react';
import Arrow from "../assets/arrow-right-solid-full.svg"
const HomeFlight = () => {
    const [flights, setFlights] = useState([]);

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

  return (
        <div className='bg-gray-200 p-8'>
            <div className='items-center w-full justify-center py-4 mb-8'>
                <h1 className='text-3xl text-center py-2'>Popular Africa World Airlines Flights</h1>
                <p className='text-md text-center'>Book your Africa World Airlines flights and enjoy a wide network of routes and a commitment to excellence. <br /> <span className=''>Africa World Airlines is the perfect choice for your next trip.</span></p>
            </div>

            <div className="grid grid-cols-2 gap-8 ml-[13rem] max-w-6xl">
                {flights.slice(0, 10).map((flight) => (
                    <div 
                    key={flight.flightId} 
                    className="flex w-full h-40 bg-white shadow-sm rounded-sm hover:shadow-2xl"
                    >
                    {/* Left image */}
                    <div className="w-40 h-full">
                        <img
                        className="w-full h-full object-cover rounded-l-md" 
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZZznTuZkcFKT0Uj5q9FELohRI2bdci6rGOQ&s" 
                        alt="" 
                        />
                    </div>

                    {/* Right content */}
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
                            <span className="font-medium text-red-500 block mb-2">
                                GHS {flight.price}
                            </span>
                            <button className="bg-red-500 text-white font-medium py-2 px-6 rounded-sm hover:bg-red-600 cursor-pointer">
                                Book
                            </button>
                        </div>
                    </div>
                    </div>
                ))}
            </div>


            <div className='ml-[13rem] w-[70rem] text-center mt-2'>
                <p className='text-sm text-gray-600'>*Fares displayed above are inclusive of taxes & fees, based on historical data, are subject to change and cannot be guaranteed at the time of booking. See all booking terms and conditions.</p>
            </div>

        </div>
    )
    }

export default HomeFlight