import React, { useState, useEffect, useRef } from "react";
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
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
    const originRef = useRef(null);
    const destinationRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (originRef.current && !originRef.current.contains(event.target)) {
                setShowOriginDropdown(false);
            }
            if (destinationRef.current && !destinationRef.current.contains(event.target)) {
                setShowDestinationDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

   useEffect(() => {
   const fetchFlights = async () => {
     try {
       console.log("DEBUG: Fetching all flights from backend");
       const res = await api.get("/flights");  // Flask backend endpoint
       console.log("DEBUG: Flights fetched successfully", res.data.length, "flights");
       setFlights(res.data);
     } catch (error) {
       console.error("Error fetching flights:", error);
     }
   };

   fetchFlights();
 }, []);

  // Fetch city suggestions based on user input
  const fetchCitySuggestions = async (query, isOrigin) => {
    if (!query || query.length < 2) {
      if (isOrigin) {
        setOriginSuggestions([]);
        setShowOriginDropdown(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationDropdown(false);
      }
      return;
    }

    try {
      const res = await api.get(`/cities/search?q=${encodeURIComponent(query)}`);
      if (isOrigin) {
        setOriginSuggestions(res.data);
        setShowOriginDropdown(true);
      } else {
        setDestinationSuggestions(res.data);
        setShowDestinationDropdown(true);
      }
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Trigger city search for origin and destination fields
    if (name === "from") {
      fetchCitySuggestions(value, true);
    } else if (name === "to") {
      fetchCitySuggestions(value, false);
    }
  };

  const selectCity = (cityName, isOrigin) => {
    if (isOrigin) {
      setFormData((prev) => ({ ...prev, from: cityName }));
      setShowOriginDropdown(false);
      setOriginSuggestions([]);
    } else {
      setFormData((prev) => ({ ...prev, to: cityName }));
      setShowDestinationDropdown(false);
      setDestinationSuggestions([]);
    }
  };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (formData.from) params.append('origin', formData.from);
            if (formData.to) params.append('destination', formData.to);
            if (formData.departureDate) params.append('date', formData.departureDate);
            if (formData.tripType) params.append('trip_type', formData.tripType);
            if (formData.cabin) params.append('cabin', formData.cabin);
            if (formData.passengers) params.append('passengers', formData.passengers);

            // Call backend search endpoint
            const response = await api.get(`/flights/search?${params.toString()}`);
            
            // Navigate to available flights with results
             navigate("/availableflights", {
                 state: { results: response.data, ...formData },
             });
        } catch (error) {
            // Navigate with empty results on error
            navigate("/availableflights", {
                state: { results: [], ...formData },
            });
        } finally {
            setLoading(false);
        }
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

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center px-4">
          <h1 className="text-2xl sm:text-3xl mt-4 md:text-4xl lg:text-5xl font-bold text-white text-center leading-tight mb-6">
            Buy A Ticket Now
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg p-4 sm:p-6 md:p-8 rounded-md max-w-4xl w-full"
          >
            {/* Trip type and currency */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
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
                className="border bg-yellow-100 border-white/40 px-3 py-2 rounded-full text-sm cursor-pointer outline-none"
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

            {/* Form fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin Input with Autocomplete */}
              <div className="relative" ref={originRef}>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  onFocus={() => formData.from.length >= 2 && setShowOriginDropdown(true)}
                  placeholder="Origin"
                  className="w-full border border-blue-200 rounded-lg px-3 py-3 outline-none"
                  autoComplete="off"
                />
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {originSuggestions.map((city, index) => (
                      <div
                        key={index}
                        onClick={() => selectCity(city.city, true)}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{city.city}</div>
                        <div className="text-xs text-gray-500">{city.country}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input with Autocomplete */}
              <div className="relative" ref={destinationRef}>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  onFocus={() => formData.to.length >= 2 && setShowDestinationDropdown(true)}
                  placeholder="Destination"
                  className="w-full border border-blue-200 rounded-lg px-3 py-3 outline-none"
                  autoComplete="off"
                />
                {showDestinationDropdown && destinationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {destinationSuggestions.map((city, index) => (
                      <div
                        key={index}
                        onClick={() => selectCity(city.city, false)}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{city.city}</div>
                        <div className="text-xs text-gray-500">{city.country}</div>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="w-full border border-blue-200 outline-none rounded-lg px-3 py-3 text-center"
                  placeholder="return date"
                />
              </div>
            </div>

            {/* Passengers, Cabin, Button */}
            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
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
                className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer mt-4 md:mt-0 text-black px-8 py-3 rounded-md font-semibold shadow-lg w-full md:w-auto"
              >
                Search Flights
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Flight List */}
      <div className="mt-4 sm:mt-6 md:mt-8">
        <List />
      </div>

      {/* Deals Section */}
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch mb-16 mt-12 px-6 w-full">
        <div className="border-none bg-white p-6 sm:p-8  shadow w-full md:w-[40rem] flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-2">
            Great Offers & Amazing Deals
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Get personalised recommendations and private deals
          </p>

          <form className="flex flex-col sm:flex-row">
            <input
              type="email"
              name="emailid"
              id="emailid"
              placeholder="Enter Email Address"
              className="flex-grow border border-blue-300 rounded-md sm:rounded-l-md sm:rounded-r-none px-4 py-2 outline-none placeholder:text-sm mb-3 sm:mb-0"
            />
            <button
              type="submit"
              className="bg-yellow-500 text-white px-6 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md hover:bg-yellow-600 transition text-sm"
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
