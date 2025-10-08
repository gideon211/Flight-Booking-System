import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";


const ItineraryPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const flight = location.state?.flight;
    const from = location.state?.from ?? flight?.departure_city_code ?? "ACCRA";
    const to = location.state?.to ?? flight?.arrival_city_code ?? "KUMASI";

    // User selections
    const [numSeats, setNumSeats] = useState(1);
    const [selectedClass, setSelectedClass] = useState(flight?.cabin_class || 'Economy');
    const [extraBaggage, setExtraBaggage] = useState(0);
    const [mealPreference, setMealPreference] = useState('Standard');

    // Pricing
    const basePrice = parseFloat(flight?.price || 0);
    const classUpgradePrice = selectedClass === 'Business' ? 200 : selectedClass === 'First Class' ? 500 : 0;
    const baggagePrice = extraBaggage * 50; // GHS 50 per extra bag
    const totalPrice = (basePrice + classUpgradePrice + baggagePrice) * numSeats;

    if (!flight) return <p>No flight selected.</p>;

    // Format times for display
    const departureTime = flight.departure_datetime 
        ? new Date(flight.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : flight.departureTime;
    const arrivalTime = flight.arrival_datetime 
        ? new Date(flight.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : flight.arrivalTime;

    return (
        <div>
            <nav className="flex justify-between px-8 items-center h-[5rem] bg-blue-200 shadow-md">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold leading-2 text-blue-500">NextTrip.</h1>
                </div>
            </nav>
            <div className="bg-gray-100 min-h-screen p-8">

                <h2 className="text-3xl font-medium mb-6 ">
                    {from.toUpperCase()} To {to.toUpperCase()}
                    
                </h2>

            
                <div className="mb-4 shadow-md rounded-b-2xl">
                    <div className="bg-blue-600 text-white px-4 py-2 font-semibold">
                        1. Your Itinerary
                    </div>
                    <div className="bg-white p-4 rounded-b-xl">
                    
                        <div className="flex justify-between items-center border-b border-blue-200 pb-4 mb-4">
                            <div>

                                <div className="flex gap-2  items-center">
                                    <div className="w-28 h-full">
                                        <img
                                        className="w-full h-full object-cover rounded-l-md" 
                                        src="https://static.vecteezy.com/system/resources/thumbnails/005/145/664/small_2x/flying-airplane-air-transportation-airline-plane-illustration-vector.jpg"
                                        alt="" 
                                        />
                                    </div>


                                    <div>
                                        <p className="text-lg font-medium ">
                                        {from.toUpperCase()} → {to.toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-600">{flight.airline}</p>
                                        <p className="text-xs text-gray-500">
                                        {flight.flight_id || flight.code} {flight.cabin_class || flight.cabin}
                                        </p>  
                                    </div>
                                </div>

                            </div>
                            <div className="text-right">
                                <p className="font-medium text-gray-700">GHS {flight.price}</p>
                            </div>
                        </div>

                    
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="font-medium">{departureTime}</p>
                                <p className="text-xs text-gray-500">{flight.departure_city_code || flight.fromAirport}</p>
                            </div>

                            <div className="text-right">
                                <p className="font-medium">{arrivalTime}</p>
                                <p className="text-xs text-gray-500">{flight.arrival_city_code || flight.toAirport}</p>
                            </div>
                        </div>

                    
                        {/* Customization Options */}
                        <div className="border-t border-gray-200 pt-4 mb-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Customize Your Booking</h3>
                            
                            {/* Number of Seats */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Passengers
                                </label>
                                <select
                                    value={numSeats}
                                    onChange={(e) => setNumSeats(parseInt(e.target.value))}
                                    className="border-2 border-blue-200 rounded px-4 py-2 w-full md:w-48 outline-none"
                                >
                                    {[...Array(Math.min(flight.seats_available || 9, 9))].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1} {i === 0 ? 'Passenger' : 'Passengers'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {flight.seats_available} seats available on this flight
                                </p>
                            </div>

                            {/* Cabin Class Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cabin Class
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div
                                        onClick={() => setSelectedClass('Economy')}
                                        className={`border-2 p-3 rounded cursor-pointer transition ${
                                            selectedClass === 'Economy'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold">✈️ Economy</p>
                                        <p className="text-xs text-gray-600">Base price</p>
                                    </div>
                                    <div
                                        onClick={() => setSelectedClass('Business')}
                                        className={`border-2 p-3 rounded cursor-pointer transition ${
                                            selectedClass === 'Business'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold">💼 Business</p>
                                        <p className="text-xs text-gray-600">+GHS 200</p>
                                    </div>
                                    <div
                                        onClick={() => setSelectedClass('First Class')}
                                        className={`border-2 p-3 rounded cursor-pointer transition ${
                                            selectedClass === 'First Class'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold">👑 First Class</p>
                                        <p className="text-xs text-gray-600">+GHS 500</p>
                                    </div>
                                </div>
                            </div>

                            {/* Extra Baggage */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Extra Baggage (GHS 50 per bag)
                                </label>
                                <select
                                    value={extraBaggage}
                                    onChange={(e) => setExtraBaggage(parseInt(e.target.value))}
                                    className="border-2 border-blue-200 rounded px-4 py-2 w-full md:w-48 outline-none"
                                >
                                    <option value={0}>No extra baggage</option>
                                    <option value={1}>1 extra bag (+GHS 50)</option>
                                    <option value={2}>2 extra bags (+GHS 100)</option>
                                    <option value={3}>3 extra bags (+GHS 150)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Standard: {flight.baggage_allowance || '23kg'} included
                                </p>
                            </div>

                            {/* Meal Preference */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meal Preference
                                </label>
                                <select
                                    value={mealPreference}
                                    onChange={(e) => setMealPreference(e.target.value)}
                                    className="border-2 border-blue-200 rounded px-4 py-2 w-full md:w-64 outline-none"
                                >
                                    <option value="Standard">Standard Meal</option>
                                    <option value="Vegetarian">Vegetarian</option>
                                    <option value="Vegan">Vegan</option>
                                    <option value="Halal">Halal</option>
                                    <option value="Kosher">Kosher</option>
                                    <option value="Gluten-Free">Gluten-Free</option>
                                    <option value="No Meal">No Meal Preference</option>
                                </select>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-blue-50 p-4 rounded mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2 text-sm">What's Included:</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✓ {flight.baggage_allowance || '23kg'} checked baggage</li>
                                <li>✓ 7kg cabin baggage</li>
                                <li>✓ In-flight meal and beverages</li>
                                <li>✓ In-flight entertainment</li>
                                <li>✓ Travel insurance (optional)</li>
                            </ul>
                        </div>

                    
                        <div className="flex justify-between">
                            <div className="flex gap-2 mb-4">
                                <input
                                type="text"
                                placeholder="Enter Gift Card/Coupon Code"
                                className="border-2 rounded border-blue-200 outline-0 w-64 p-2 h-15 placeholder:text-sm"
                                />
                                <input
                                type="text"
                                placeholder="PIN"
                                className="border-2 rounded p-2 w-24 border-blue-200 h-15 outline-0 placeholder:text-sm"
                                />
                                <button className="bg-blue-500 rounded-md text-white px-4 h-15 cursor-pointer hover:bg-blue-400">Apply</button>
                            </div>
                            <div className="items-end flex flex-col">
                                
                                <div className="text-right mb-4">
                                    <p className="text-sm text-gray-600">Base Price: GHS {basePrice.toFixed(2)}</p>
                                    {classUpgradePrice > 0 && (
                                        <p className="text-sm text-gray-600">Class Upgrade: +GHS {classUpgradePrice.toFixed(2)}</p>
                                    )}
                                    {baggagePrice > 0 && (
                                        <p className="text-sm text-gray-600">Extra Baggage: +GHS {baggagePrice.toFixed(2)}</p>
                                    )}
                                    {numSeats > 1 && (
                                        <p className="text-sm text-gray-600">× {numSeats} passengers</p>
                                    )}
                                    <div className="flex gap-4 items-center font-semibold mt-2">
                                        <span>Grand Total:</span>
                                        <span className="text-red-600 text-xl">GHS {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate("/email", { 
                                        state: { 
                                            flight,
                                            bookingDetails: {
                                                numSeats,
                                                selectedClass,
                                                extraBaggage,
                                                mealPreference,
                                                totalPrice
                                            }
                                        } 
                                    })}
                                    className="bg-yellow-400 hover:bg-yellow-500 px-8 py-3 rounded font-medium text-black cursor-pointer"
                                >
                                    CONTINUE
                                </button>

                            </div>


                        </div>



                    </div>
                </div>

            
                <div className="mb-4 shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                        2. Your Email ID
                    </div>
                </div>

                
                <div className="mb-4 rounded-b-2xl">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl text-gray-600">
                        3. Traveller Details
                    </div>
                </div>

            
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
