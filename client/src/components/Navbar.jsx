import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';
import Car from "../assets/car-solid-full.svg";
import Umbrella from "../assets/umbrella-beach-solid-full.svg";
import Boat from "../assets/sailboat-solid-full.svg";
import Cart from "../assets/cart-flatbed-suitcase-solid-full (1).svg";
import Build from "../assets/building-solid-full.svg";
import House from "../assets/house-solid-full.svg";
import { useTranslation } from "react-i18next";

// Example API call to fetch bookings
// Replace with your real API function
const fetchUserBookings = async (userId) => {
  return [
    { id: 1, flight: "Accra → London", date: "2025-09-20" },
    { id: 2, flight: "Accra → Dubai", date: "2025-10-01" },
  ];
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const dropdownRef = useRef(null);

    useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
    }, []);

  useEffect(() => {
    if (user) {
      fetchUserBookings(user.id).then(setBookings);
    }
  }, [user]);

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    i18n.changeLanguage(selectedLang);
  };



  return (

    <nav className="flex justify-between px-8 items-center h-[5rem] bg-white shadow-md">
      {/* Logo */}
      <div className="h-6 flex items-center">
        <img
          src="https://cdn.travelwings.com/web-assets/images/travelwings-logo.svg"
          alt="logo"
          className="w-64"
        />
      </div>

      {/* Icons */}
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

      {/* Right side */}
      <div className="flex items-center gap-6">
        {/* Language selector */}
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

        {/* Account dropdown */}
        <div className="relative">
          <button
            ref={dropdownRef}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="focus:outline-none px-3 py-2 bg-red-400 rounded-md hover:bg-red-500 text-white font-medium cursor-pointer"
          >
            Account
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-md z-50 shadow-2xl py-2 max-h-80 overflow-y-auto">
              {!user ? (
                <div>
                  <Link
                    to="/Login"
                    className="block px-4 py-2 text-gray-700 hover:bg-red-100 "
                  >
                    Login
                  </Link>
                  <Link
                    to="/SignUp"
                    className="block px-4 py-2 text-gray-700 hover:bg-red-100 "
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div>
                  {/* Bookings list */}
                  <div className="px-4 py-2 border-b font-semibold text-gray-700">
                    My Tickets
                  </div>
                  {bookings.length > 0 ? (
                    bookings.map((b) => (
                      <div
                        key={b.id}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-red-100"
                      >
                        <div>{b.flight}</div>
                        <div className="text-xs text-gray-500">{b.date}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      No tickets booked yet
                    </div>
                  )}

                  {/* Logout button */}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 mt-2 text-gray-700 hover:bg-red-100"
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
