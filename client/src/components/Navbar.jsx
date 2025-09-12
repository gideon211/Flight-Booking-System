import React from 'react'
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import House from "../assets/house-solid-full.svg";
import { AuthContext } from '../context/AuthContext';
import { Link } from "react-router-dom";


import { useTranslation } from "react-i18next";
import { useState, useContext } from 'react';


const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");
   const [dropdownOpen, setDropdownOpen] = useState(false);

          const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    i18n.changeLanguage(selectedLang);
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

                        <div>



                        <div className="relative">
                                <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="focus:outline-none px-3 py-2 bg-red-400 rounded-md text-white font-medium  cursor-pointer"
                                >
                                Account
                                </button>

                                {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border-none rounded-md z-50 outline-0 shadow-2xl py-2">
                                        {!user ? (
                                                <Link
                                                to="/Login"
                                                className="block px-4 py-2 text-gray-700 hover:bg-red-100 font-medium"
                                                >
                                                Login
                                                </Link>
                                        ) : (
                                                <button
                                                onClick={logout}
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-100"
                                                >
                                                Logout
                                                </button>
                                        )}
                                        </div>
                                        )}
                                </div>





                        </div>
                </div>


        </nav>
    </div>
  )
}

export default Navbar