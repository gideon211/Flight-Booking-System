import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import List from "../components/HomeFlight"

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/Login");
  };

  return (
    <div>
      <Navbar />

      <section>
            <div className="h-[500px] flex flex-col justify-center bg-[url('https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
                <div className="text-center items-center mt-[15rem]">
                    <h1 className="text-4xl text-white font-bold font-stretch-extra-condensed">
                    Book Cheap Africa world Airlines Flight
                    </h1>
                    <p className="text-white justify-center font-medium">
                    Africa World Airlines (AW): Fly with us, and see the world in a
                    new light
                    </p>
                </div>
              </div>

               <div>
                    <form
                    onSubmit={(e) => {
                    e.preventDefault();
                    }}
                    className="  mx-auto bg-white p-[34px] rounded-xl shadow-md  top-[33rem] absolute right-[20rem]"
                    >
                    {/* Trip Type */}
                        <div className="mb-4 flex gap-2 ">
                            <label className="flex items-center gap-2 px-6 py-2 rounded-full cursor-pointer bg-red-50 peer-checked:bg-red-100">
                                <input
                                type="radio"
                                name="tripType"
                                value="OneWay"
                                defaultChecked
                                className="peer accent-red-500"
                                />
                                <span className="font-medium peer-checked:text-red-600">
                                One-way
                                </span>
                            </label>

                            {/* Roundtrip */}
                            <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-red-50 peer-checked:bg-red-100">
                                <input
                                type="radio"
                                name="tripType"
                                value="RoundTrip"
                                className="peer accent-red-500"
                                />
                                <span className="font-medium peer-checked:text-red-600">
                                Roundtrip
                                </span>
                            </label>

                        </div>

                        <div className="flex gap-5 mb-5">
                            {/* From & To */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem] mb-4">
                                <div className="relative">
                                <label
                                    htmlFor="from"
                                    className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                >
                                    From
                                </label>
                                <input
                                    type="text"
                                    id="from"
                                    placeholder="From (city or airport)"
                                    className="py-[25px] px-[15px] border-2 border-gray-300 p-2 outline-0 rounded-md"
                                />
                                </div>

                                <div className="relative">
                                    <label
                                    htmlFor="to"
                                    className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                    >
                                        To
                                    </label>
                                    <input
                                    type="text"
                                    id="to"
                                    placeholder="To (city or airport)"
                                    className="py-[25px] px-[15px] border-2 border-gray-300 p-2 outline-0 rounded-md"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                    <label
                                    htmlFor="departure"
                                    className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                    >
                                        Departure Date
                                    </label>
                                    <input
                                    type="date"
                                    id="departure"
                                    className="py-[25px] border-2 border-gray-300 p-2 outline-0 rounded-md"
                                    />
                                </div>

                                <div className="relative">
                                    <label
                                    htmlFor="return"
                                    className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                    >
                                    Return Date
                                    </label>
                                    <input
                                    type="date"
                                    id="return"
                                    className="py-[25px] border-2 border-gray-300 p-2 outline-0 rounded-md"
                                    />
                                </div>
                            </div>

                              {/* Passengers */}
                              <div className="relative mb-4">
                                   <label
                                   htmlFor="passengers"
                                   className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                   >
                                   Traveller
                                   </label>
                                   <input
                                   type="number"
                                   id="passengers"
                                   min="1"
                                   defaultValue="1"
                                   className="py-[25px] px-[15px] border-2 border-gray-300 p-2 outline-0 rounded-md Y"
                                   />
                              </div>

                              {/* Class */}
                              <div className="relative mb-4">
                                   <label
                                   htmlFor="cabin"
                                   className="absolute -top-2 left-3 bg-white px-1 text-md font-medium"
                                   >
                                   Cabin Class
                                   </label>
                                   <select
                                   id="cabin"
                                   className="py-[25px] border-2 border-gray-300 p-2 rounded-md"
                                   >
                                        <option>Economy</option>
                                        <option>Premium</option>
                                        <option>Business</option>
                                        <option>First Class</option>
                                   </select>
                              </div>
                         </div>

                        <div className="flex justify-center items-center absolute -bottom- right-[35rem]">
                            <button
                            type="submit"
                            className="bg-red-500 cursor-pointer hover:bg-red-600 text-white text-xl px-10 py-5 rounded-full flex items-center gap-2 font-medium"
                            >
                                <img
                                src="https://cdn.travelwings.com/b2c-production/static/html/staticPages/assets/img/lets-fly.svg"
                                width="24"
                                alt="fly"
                                className="w-9 mr-3"
                                />
                                LET'S FLY
                            </button>
                         </div>
                    </form>
               </div>
      </section>



      <div className="mt-[20rem] ">
        <List />
      </div>

      <div className="flex gap-8 ml-[12rem] items-stretch mb-8 mt-8">
        {/* Left Image Card */}
        <div className="border border-gray-400 w-[40rem] rounded-sm overflow-hidden items-center justify-center flex h-[10rem]">
            <img
            src="https://cdn.travelwings.com/assets/images/Destination-Landing-page-1.png"
            className="h- object-cover"
            alt="Destination-Landing"
            />
        </div>

        {/* Right Newsletter Card */}
        <div className="border border-gray-400 w-[40rem] h-[10rem] p-8 bg-white rounded-md shadow-sm flex flex-col justify-center">
            <h2 className="text-md font-medium mb-2">Great Offers & Amazing Deals</h2>
            <p className="text-gray-600 mb-2 text-sm">
            Get personalised recommendations and private deals
            </p>

            <form className="flex">
            <input
                type="email"
                name="emailid"
                id="emailid"
                placeholder="Enter Email Address"
                className="flex-grow border border-red-300 rounded-l-sm px-4  outline-none placeholder:text-sm"
            />
            <button
                type="submit"
                className="bg-red-500 text-white px-6 py-3 rounded-r-sm hover:bg-red-600 transition cursor-pointer text-sm"
            >
                Subscribe
            </button>
            </form>
        </div>
       </div>









    </div>
  );
};

export default Home;
