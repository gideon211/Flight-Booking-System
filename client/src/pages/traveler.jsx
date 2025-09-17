import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const TravelerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { flight, email } = location.state || {};

  // Form state
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/payment", {
      state: { flight, email, traveler: { title, firstName, lastName, dob, mobile } },
    });
  };

  if (!flight) return <p>No flight selected.</p>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">


      <div className="grid grid-cols-3 gap-6">
            {/* Left Side - Steps */}
            <div className="col-span-2 space-y-4">
                {/* Step 1 */}
                <div className="shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                    1. Your Itinerary
                    </div>
                </div>

                {/* Step 2 */}
                <div className="shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                    2. Your Email ID
                    </div>
                </div>

                {/* Step 3 - Active */}
                <div className="shadow-md rounded-b-2xl">
                    <div className="bg-blue-600 text-white px-4 py-2 font-semibold">
                        3. Traveller Details
                    </div>
                    <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-b-xl space-y-4 items-center justify-center text-center"
                    >
                        <div className="w-full h-[3rem] flex justify-center items-center bg-blue-400 rounded-b-lg">
                            <h3 className="font-medium text-white text-xl">Adult - 1</h3>
                        </div>

                        

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                            Title <span className="text-red-500">*</span>
                            </label>
                            <select
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="border rounded px-3 py-2 w-28 border-blue-200 outline-0"
                            >
                            <option value="">Select</option>
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                            <option value="Dr">Dr</option>
                            </select>
                        </div>

                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                            First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="border rounded px-3 py-2 w-64 outline-0 border-blue-200"
                            required
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                            Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="border rounded px-3 py-2 w-64 border-blue-200 outline-0"
                            required
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                            Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="border rounded px-3 py-2 w-64 border-blue-200 outline-0"
                            required
                            />
                        </div>

                            {/* Mobile */}
                        <div className="flex flex-col items-center justify-center">
                            <label className="block text-sm font-medium mb-1">
                                Mobile No. <span className="text-red-500">*</span>
                            </label>
                            <div className="flex w-64">
                                <span className="px-3 py-2 border rounded-l bg-gray-200 text-sm border-blue-200">
                                +233
                                </span>
                                <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="border rounded-r px-3 py-2 flex-1 w-64 border-blue-200 outline-0"
                                required
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-1 cursor-pointer">
                                Optional: Add frequent flyer number
                            </p>
                        </div>


                        {/* Continue */}
                        <div className="text-right">
                            <button
                            onClick={() => navigate("/payment", { state: { flight } })}
                            type="submit"
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-8 py-3 rounded"
                            >
                            CONTINUE
                            </button>
                        </div>
                    </form>
                </div>

                {/* Step 4 */}
                <div className="shadow-md rounded-b-2xl text-gray-600">
                    <div className="bg-gray-200 px-4 py-2 font-medium rounded-b-2xl">
                        4. Payment Methods <span className="text-green-600">Safe Secured</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Summary */}
            <div>
                <div className="bg-white shadow rounded-md p-4">
                    <h3 className="font-semibold mb-3">Summary</h3>
                    <div className="text-sm text-gray-700 mb-2">
                        <p>{flight.airline}</p>
                        <p>
                            {flight.origin.city} ({flight.origin.code}){" "}
                            <strong>{flight.departureTime}</strong> →{" "}
                            {flight.destination.city} ({flight.destination.code}){" "}
                            <strong>{flight.arrivalTime}</strong>
                        </p>
                        <p>{flight.departureDate}</p>
                    </div>
                    <div className="border-t pt-2 text-sm space-y-1">
                        <p>
                            Net Fare:{" "}
                            <span className="text-red-600 font-semibold">
                            GHS {flight.price}
                            </span>
                        </p>
                        <p>Taxes & Fees: GHS 220.00</p>
                        <p className="font-bold text-lg">
                            Total: GHS {flight.price + 220}
                        </p>
                    </div>
                </div>
            </div>
      </div>
    </div>
  );
};

export default TravelerPage;
