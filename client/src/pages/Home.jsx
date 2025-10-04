import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import List from "../components/HomeFlight";
import Footer from "../components/Footer";
import Airlines from "../components/Airlines";
import Loader from "../components/Loader";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import api from "../api/axios";


const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [flights, setFlights] = useState([]);
    const [formData, setFormData] = useState({
        tripType: "oneway", // match radio values
        from: "",
        to: "",
        departureDate: "",
        returnDate: "",
        passengers: 1,
        cabin: "",
        currency: "USD",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

   useEffect(() => {
  const fetchFlights = async () => {
    try {
      const res = await api.get("/flights");  // Flask backend endpoint
      setFlights(res.data);
    } catch (error) {
      console.error("Error fetching flights:", error);
    }
  };

  fetchFlights();
}, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            const filtered = flights.filter((flight) => {
                return (
                    (!formData.tripType ||
                        flight.tripType.toLowerCase() ===
                        formData.tripType.toLowerCase()) &&
                    (!formData.from ||
                        flight.origin.city
                        .toLowerCase()
                        .includes(formData.from.toLowerCase())) &&
                    (!formData.to ||
                        flight.destination.city
                        .toLowerCase()
                        .includes(formData.to.toLowerCase())) &&
                    (!formData.departureDate ||
                        flight.departureDate === formData.departureDate) &&
                    (formData.tripType !== "RoundTrip" ||
                        !formData.returnDate ||
                        flight.returnDate === formData.returnDate) &&
                    (!formData.cabin ||
                        flight.cabin.toLowerCase() === formData.cabin.toLowerCase()) &&
                    flight.seatsAvailable >= Number(formData.passengers || 1)
                );
            });
            setLoading(false);
            navigate("/Availableflights", {
                state: { results: filtered, ...formData },
            });
        }, 2000);
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-blue-50">
        
            {loading && (
                <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                    <Loader />
                </div>
            )}

            <Navbar />

                    
            <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={() => navigate("/superadmin-login")}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
                        hover:from-pink-600 hover:via-purple-600 hover:to-blue-600
                        text-white font-bold text-xl shadow-xl flex items-center justify-center
                        transition-all duration-300 transform hover:scale-110 hover:rotate-6"
            >
                🔑
            </button>
            </div>



            <div
                className="relative flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat min-h-[500px]"
                style={{
                backgroundImage:
                    "url('https://pixels-cache.icelandair.com/upload/w_780%2Cg_auto%2Cc_fill%2Cf_auto%2Cq_auto/icelandair/blt356056608d00502b.jpg')",
                }}
            >
                
            <div className="absolute inset-0 bg-black/10 bg-opacity-40"></div>

            
            <div className="z-10 text-center text-white px-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold">
                Flights to Ghana starting
            </h1>
            </div>

        
            <form
            onSubmit={handleSubmit}
            className="z-10 bg-white shadow-lg p-6 md:p-8 max-w-4xl w-full"
            >
        
                <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-yellow-100">
                        <input
                            type="radio"
                            name="tripType"
                            value="oneway"
                            checked={formData.tripType === "oneway"}
                            onChange={handleChange}
                            className="accent-yellow-500"
                        />
                        <span className="font-medium">One Way</span>
                    </label>


                    <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-yellow-100">
                        <input
                            type="radio"
                            name="tripType"
                            value="round"
                            checked={formData.tripType === "round"}
                            onChange={handleChange}
                            className="accent-yellow-500"
                        />
                        <span className="font-medium">Round Trip</span>
                    </label>


                    <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="border bg-yellow-100 border-white/40 px-2 py-2 rounded-full text-sm cursor-pointer outline-none"
                    >
                        <option className="bg-white" value="GHC">
                            GHC
                        </option>
                        <option className="bg-white" value="USD">
                            USD
                        </option>
                        <option className="bg-white" value="EUR">
                            EUR
                        </option>
                    </select>
                </div>

        
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">    
                    <div className="mt-6">
                        <input
                        type="text"
                        name="from"
                        value={formData.from}
                        onChange={handleChange}
                        placeholder="Origin"
                        className="w-full border border-blue-200 outline-none rounded-lg px-3 py-3"
                    />
                    </div>

                    <div className="mt-6">
                        <input
                        type="text"
                        name="to"
                        value={formData.to}
                        onChange={handleChange}
                        placeholder="Destination"
                        className="w-full border border-blue-200 rounded-lg px-3 py-3 outline-none"
                        />
                    </div>

                    <div>
                        <label
                        htmlFor="departure"
                        className="block text-sm font-medium mb-1 text-center"
                        >
                        Departure
                        </label>
                        <Flatpickr
                        id="departure"
                        name="departureDate"
                        placeholder="departure date"
                        value={formData.departureDate} 
                        options={{ dateFormat: "d-m-Y" }}
                        onChange={(selectedDates, dateStr) => {
                            setFormData((prev) => ({
                                ...prev,
                                departureDate: dateStr,
                            }));
                        }}
                        className="w-full border rounded-lg px-3 py-3 border-blue-200 outline-none text-center"
                        />


                    </div>

                    <div>
                        <label
                        htmlFor="return"
                        className="block text-sm font-medium mb-1 text-center"
                        >
                        Return
                        </label>
                            <Flatpickr
                            id="return"
                            name="returnDate"
                            value={formData.returnDate}
                            options={{ dateFormat: "d-m-Y" }}
                            onChange={(selectedDates, dateStr) => {
                                setFormData((prev) => ({
                                ...prev,
                                returnDate: dateStr,
                                }));
                            }}
                            className="w-full border border-blue-200 outline-none rounded-lg px-3 py-3 text-center "
                            placeholder="return date"
                        />


                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                
                        <div>
                            <label
                            htmlFor="passengers"
                            className="block text-sm font-medium mb-1"
                            >
                            Passengers
                            </label>
                            <input
                            type="number"
                            id="passengers"
                            name="passengers"
                            min="1"
                            value={formData.passengers}
                            onChange={handleChange}
                            className="w-full border border-blue-200 rounded-lg px-3 py-3 outline-none"
                            />
                        </div>

                    
                        <div>
                            <label
                            htmlFor="cabin"
                            className="block text-sm font-medium mb-1"
                            >
                            Cabin Class
                            </label>
                            <select
                            id="cabin"
                            name="cabin"
                            value={formData.cabin}
                            onChange={handleChange}
                            className="w-full border-2 rounded-lg px-3 py-3 outline-none border-blue-200"
                            >
                            <option>Economy</option>
                            <option>Premium</option>
                            <option>Business</option>
                            <option>First Class</option>
                            </select>
                        </div>

                    </div>

            
                    <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer mt-4 text-black px-10 py-4 rounded-md font-semibold shadow-lg w-full md:w-auto"
                    >
                    Search Flights
                    </button>
                </div>
            </form>
        </div>


            <div className="mt-[0rem]">
            <List />
            </div>


            <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch mb-16 mt-12 px-6 w-full">
                <div className="border-none bg- p-8  w-full md:w-[40rem] flex flex-col justify-center">
                    <h2 className="text-lg font-semibold mb-2">
                        Great Offers & Amazing Deals
                    </h2>
                    <p className="text-gray-600 mb-4 text-sm">
                        Get personalised recommendations and private deals
                    </p>

                    <form className="flex">
                        <input
                        type="email"
                        name="emailid"
                        id="emailid"
                        placeholder="Enter Email Address"
                        className="flex-grow border border-blue-300 rounded-l-md px-4 py-2 outline-none placeholder:text-sm"
                        />
                        <button
                        type="submit"
                        className="bg-yellow-500 text-white px-6 py-2 rounded-r-md hover:bg-yellow-600 transition text-sm"
                        >
                        Subscribe
                        </button>
                    </form>
                </div>
            </div>

        <Airlines />
        <Footer />
        </div>
    );
};

export default Home;
