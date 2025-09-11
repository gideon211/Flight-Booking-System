import React, { useState } from "react";
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import House from "../assets/house-solid-full.svg";

const Home = () => {
  const [language, setLanguage] = useState("en");

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    // Later you can call i18n.changeLanguage(e.target.value)
    console.log("Language switched to:", e.target.value);
  };

  return (
        <div>
                <nav className="flex justify-between px-8 items-center h-[5rem] bg-white shadow-md">
                        {/* Logo */}
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

                                
                                <li>
                                <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="border-none px-2 py-1 rounded cursor-pointer"
                                >
                                        <option value="en">
                                        <span className="fi fi-gb mr-2"></span> English
                                        </option>
                                        <option value="fr">
                                        <span className="fi fi-fr mr-2"></span> Français
                                        </option>
                                        <option value="es">
                                        <span className="fi fi-es mr-2"></span> Español
                                        </option>
                                        <option value="de">
                                        <span className="fi fi-de mr-2"></span> Deutsch
                                        </option>
                                </select>

                                </li>
                        </ul>
                </nav>
        </div>
  );
};

export default Home;
