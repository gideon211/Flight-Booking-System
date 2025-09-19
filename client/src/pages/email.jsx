import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Footer from "../components/Footer";

const EmailPage = () => {
  const location = useLocation();
  const flight = location.state?.flight;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  if (!flight) return <p>No flight selected.</p>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h2 className="text-3xl font-medium mb-6">
        {location.state?.from?.toUpperCase() ?? "ACCRA"} To{" "}
        {location.state?.to?.toUpperCase() ?? "KUMASI"}
      </h2>

      <div className="grid grid-cols-3 gap-6">
        
            <div className="col-span-2 space-y-4">
                
                <div className="mb-4 shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                        1. Your Itinerary
                    </div>
                </div>

                
                <div className="mb-4 shadow-md rounded-b-2xl">
                    <div className="bg-blue-600 text-white px-4 py-2 font-semibold">
                        2. Your Email ID
                    </div>
                    <div className="bg-white p-6 rounded-b-xl">
                        <p className="mb-2 text-gray-700">
                            Your booking details will be sent to this email address.
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                            
                            <div className="flex-1">
                                <label
                                    htmlFor="email"
                                    className="block text font-medium mb-1"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-72 border-2 rounded px-3 py-2 border-blue-100 placeholder:"
                                />
                            </div>




                            <div className="flex flex-col gap-6 items-center">
                                <div>
                            
                                    <button className=" flex items-center border border-gray-100 px-4 py-2 rounded shadow hover:bg-gray-50">
                                    <img
                                    src="https://developers.google.com/identity/images/g-logo.png"
                                    alt="Google"
                                    className="w-5 h-5 mr-2"
                                    />
                                    Sign in with Google
                                    </button>
                                </div>

                                <div>
                                    <button
                                    onClick={() => navigate("/traveler", { state: { flight } })}
                                    className="bg-yellow-400 hover:bg-yellow-500 px-8 py-3 rounded font-medium text-black cursor-pointer"
                                    >
                                    CONTINUE
                                    </button>
                                </div>
                            </div>


                        </div>

                        
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" className="accent-red-500" />
                            I have a Travelwings Account
                        </label>

                    </div>

                </div>

             
                <div className="mb-4 shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                      3. Traveller Details
                    </div>
                </div>

         
                <div className="mb-4 rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                      4. Payment Methods <span className="text-green-600">Safe Secured</span>
                    </div>
                </div>
            </div>


        <div>
          <div className="bg-white shadow rounded-b-md p-4 h-[20rem]">
                <h1 className="font-semibold mb-3 text-3xl">Summary</h1>
                <div className="text-sm text-gray-700 mb-2">
                    <p className="text-xl"> {flight.airline}</p>
                    <p className="text-md">
                        {flight.origin.city} ({flight.origin.code}){" "}
                        <strong>{flight.departureTime}</strong> →{" "}
                        {flight.destination.city} ({flight.destination.code}){" "}
                        <strong>{flight.arrivalTime}</strong>
                    </p>
                    <p>{flight.departureDate}</p>
                </div>
                <div className="border-t pt-2 text-sm space-y-1 border-gray-300">
                    <p className="mt-4 text-lg">
                        Net Fare:{" "}
                        <span className="text-red-500 font-medium text-md">
                        GHS {flight.price}
                        </span>
                    </p>
                    <p>Taxes & Fees: GHS 75.00</p>
                    <p className="font- text-lg text-red-500">
                        <span className="text-md font-medium ">Total:</span> GHS {flight.price + 75}
                    </p>
                </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmailPage;

