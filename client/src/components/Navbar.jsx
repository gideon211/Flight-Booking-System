import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane } from "@fortawesome/free-solid-svg-icons";




const fetchUserBookings = async (userId) => {
  return [
    { id: 1, flight: "Accra → London", date: "2025-09-20" },
    { id: 2, flight: "Accra → Dubai", date: "2025-10-01" },
  ];
};

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useState("en");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [bookings, setBookings] = useState([]);
    const dropdownRef = useRef(null);


    useEffect(() => {
        const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
        }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) fetchUserBookings(user.id).then(setBookings);
    }, [user]);

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        i18n.changeLanguage(e.target.value);
    };

    const handleFlightsClick = () => { 
        navigate("/Availableflights", { state: { results: flights } });

    }

    return (
        <nav className="flex justify-between items-center px-8 h-[4.5rem] bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg">

            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPlane} style={{ color: "#1b69ee", fontSize: "34px" }} />
                <h1 className="text-2xl font-bold leading-2">NextTrip.</h1>
            </div>


            <ul className="hidden md:flex gap-8 font-medium">
                <li
                className="hover:text-yellow-300 cursor-pointer transition"
                onClick={handleFlightsClick}
                >
                Flights
                </li>

                <li className="hover:text-yellow-300 cursor-pointer transition">
                {t("Hotels")}
                </li>
                <li className="hover:text-yellow-300 cursor-pointer transition">
                {t("Packages")}
                </li>
                <li className="hover:text-yellow-300 cursor-pointer transition">
                {t("Car Rentals")}
                </li>
            </ul>

        
            <div className="flex items-center gap-6">
                <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent border border-white/40 px-2 py-1 rounded text-sm cursor-pointer text-gray-300 outline-none"
                >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
                <option value="de">DE</option>
                </select>
                <div className="relative" ref={dropdownRef}>
                    <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition cursor-pointer"
                    >
                    <span className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black">
                    {user ? user.name?.[0] || "U" : "?"}
                    </span>
                    <span className="hidden sm:inline font-medium">
                    {user ? user.name : "Account"}
                    </span>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-1 mt-2 w-72 bg-white text-gray-800  rounded-l shadow-xl overflow-hidden z-50 cursor-pointer">
                            {!user ? (
                                <div className="flex flex-col font-medium">
                                    <Link
                                    to="/login"
                                    className="px-4 py-3 hover:bg-gray-200 transition"
                                    >
                                    Login
                                    </Link>

                                    <Link
                                    to="/signup"
                                    className="px-4 py-3 hover:bg-gray-200 transition"
                                    >
                                    Register
                                    </Link>

                                    <div className="flex flex-col">
                                        <Link
                                        to="/TicketSection"
                                        className="px-4 py-3 hover:bg-gray-200 transition"
                                        >
                                        My Tickets
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="px-4 py-3 border-b">
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                        {/* Admin Dashboard (only for admins) */}
                                        {user.role === "admin" && (
                                            <Link
                                            to="/dashboard"
                                            className="block px-4 py-3 hover:bg-gray-200 transition text-blue-600 font-semibold"
                                            >
                                            Dashboard
                                            </Link>
                                        )}


                                
                                    <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition"
                                    >
                                    Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
