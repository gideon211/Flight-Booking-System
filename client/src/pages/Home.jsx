import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

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
                <div className="h-[500px] flex flex-col justify-center bg-[url('https://e3.365dm.com/24/10/1600x900/skynews-turkish-plane_6711620.jpg?20241009165726')] bg-cover bg-center">
                        <div className="text-center items-center mt-[15rem]">
                                <h1 className="text-4xl text-white font-bold font-stretch-extra-condensed">Book Cheap Africa world Airlines Flight</h1>
                                <p className="text-white justify-center font-medium">Africa World Airlines (AW): Fly with us, and see the world in a new light</p>
                        </div>
                
                </div>

                <div>
                        <form
                        onSubmit={(e) => {
                        e.preventDefault();
                        // handle booking submission here
                        }}
                        className="w-[]  mx-auto bg-white p-[34px] rounded-xl shadow-md  top-[33rem] absolute right-[20rem]"
                        >
                        {/* Trip Type */}
                        <div className="mb-4 flex gap-2">
 
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
                                className="bg-red-500 cursor-pointer hover:bg-red-700 text-white text-xl px-10 py-8 rounded-full flex items-center gap-2 font-bold"
                                >
                                <img
                                        src="https://cdn.travelwings.com/b2c-production/static/html/staticPages/assets/img/lets-fly.svg"
                                        width="24"
                                        alt="fly"
                                />
                                LET'S FLY
                                </button>
                        </div>
                        </form>


                </div>

        </section>                        








    </div>
  );
};

export default Home;
