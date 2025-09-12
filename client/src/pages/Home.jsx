import React, { useState, useEffect } from "react";
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import House from "../assets/house-solid-full.svg";



import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // check login state when page loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    i18n.changeLanguage(selectedLang);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/Login");
  };

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
                        <li className="w-7 cursor-pointer">
                        <img src={House} alt="Home" />
                        </li>
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

        
                <div className="flex items-center gap-6">
                        
                        <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="border-none px-2 py-1 rounded cursor-pointer outline-0"
                        >
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="es">Español</option>
                                <option value="de">Deutsch</option>
                        </select>

                        
                        <div className="relative">
                                <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="focus:outline-none"
                                >

                                </button>

                                {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border shadow-md rounded-md">
                                        {!isLoggedIn ? (
                                        <Link
                                        to="/Login"
                                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                        >
                                        Login
                                        </Link>
                                        ) : (
                                        <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                        >
                                        Logout
                                        </button>
                                        )}
                                </div>
                                )}
                        </div>
                </div>


        </nav>


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
                        className="w-[]  mx-auto bg-white p-[54px] rounded-xl shadow-md  top-[33rem] absolute right-[20rem]"
                        >
                        {/* Trip Type */}
                        <div className="mb-4 flex gap-2">
 
                                <label className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-red-50 peer-checked:bg-red-100">
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
                                        className="py-[25px] px-[15px] border-2 border-gray-300 p-2 outline-0 rounded-md"
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
