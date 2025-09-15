import { useLocation, useNavigate } from "react-router-dom";
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import Flight from "../assets/flights.svg";

const ItineraryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const flight = location.state?.flight;
    const from = location.state?.from ?? "ACCRA";
    const to = location.state?.to ?? "KUMASI";

  if (!flight) return <p>No flight selected.</p>;

  return (
    <div>
        <nav className="flex justify-between px-8 items-center h-[5rem] bg-white shadow-md">
            <div className="h-6 flex items-center">
                <img
                src="https://cdn.travelwings.com/web-assets/images/travelwings-logo.svg"
                alt="logo"
                className="w-64"
                />
            </div>

            <ul className="flex gap-6 items-center">
                <div className="flex mr-10 ">
                <li className="w-7 cursor-pointer flex gap-1">
                    <img src={Flight} alt="Home" />
                    <p className="font-semibold">Flights</p>
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
        <div className="bg-gray-100 min-h-screen p-8">

            <div>

            </div>
        <h2 className="text-3xl font-medium mb-6 ">
            {from.toUpperCase()} To {to.toUpperCase()}
            
        </h2>

        {/* Step 1: Your Itinerary */}
        <div className="mb-4 shadow-md rounded-b-2xl">
            <div className="bg-red-600 text-white px-4 py-2 font-semibold">
                1. Your Itinerary
            </div>
            <div className="bg-white p-4 rounded-b-xl">
                {/* Flight info */}
                <div className="flex justify-between items-center border-b border-red-200 pb-4 mb-4">
                    <div>

                        <div className="flex items-center">
                            <div className="w-40 h-full">
                                <img
                                className="w-full h-full object-cover rounded-l-md" 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZZznTuZkcFKT0Uj5q9FELohRI2bdci6rGOQ&s" 
                                alt="" 
                                />
                           </div>


                           <div>
                                <p className="text-lg font-medium ">
                                {from.toUpperCase()} → {to.toUpperCase()}
                                </p>
                                <p className="text-sm text-gray-600">{flight.airline}</p>
                                <p className="text-xs text-gray-500">
                                {flight.code} {flight.cabin}
                                </p>  
                           </div>
                        </div>

                        </div>
                        <div className="text-right">
                        <p className="font-medium text-gray-700">GHS {flight.price}</p>
                        </div>
                   </div>

                {/* Times */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="font-medium">{flight.departureTime}</p>
                        <p className="text-xs text-gray-500">{flight.fromAirport}</p>
                    </div>

                    <div className="text-right">
                        <p className="font-medium">{flight.arrivalTime}</p>
                        <p className="text-xs text-gray-500">{flight.toAirport}</p>
                    </div>
                </div>

                {/* Baggage */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
                    <span>🧳 Baggage: 23kg</span>
                    <span>Adult</span>
                </div>

                {/* Gift card */}
                <div className="flex justify-between">
                    <div className="flex gap-2 mb-4">
                        <input
                        type="text"
                        placeholder="Enter Gift Card/Coupon Code"
                        className="border-2 rounded border-red-200 outline-0 w-64 p-2 h-15 placeholder:text-sm"
                        />
                        <input
                        type="text"
                        placeholder="PIN"
                        className="border-2 rounded p-2 w-24 border-red-200 h-15 outline-0 placeholder:text-sm"
                        />
                        <button className="bg-red-500 rounded-md text-white px-4 h-15 cursor-pointer hover:bg-red-400">Apply</button>
                    </div>
                    <div className="items-end flex flex-col">
                        {/* Total */}
                        <div className="flex gap-4 items-center font-semibold mb-4">
                            <span>Grand Total:</span>
                            <span className="text-red-600">GHS {flight.price}</span>
                        </div>

                        <button
                            onClick={() => navigate("/email", { state: { flight } })}
                            className="bg-yellow-400 hover:bg-yellow-500 px-8 py-3 rounded font-medium text-black cursor-pointer"
                        >
                            CONTINUE
                        </button>

                    </div>


                </div>



            </div>
        </div>

        {/* Step 2 */}
        <div className="mb-4 shadow-md rounded-b-2xl text-gray-600">
            <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
            2. Your Email ID
            </div>
        </div>

        {/* Step 3 */}
        <div className="mb-4 rounded-b-2xl">
            <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl text-gray-600">
            3. Traveller Details
            </div>
        </div>

        {/* Step 4 */}
        <div className="mb-4  rounded-b-2xl">
            <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl text-gray-600">
            4. Payment Methods <span className="text-green-600">Safe Secured</span>
            </div>
        </div>
        </div>
    </div>
  );
};

export default ItineraryPage;
