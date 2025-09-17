import React, { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

// Fake API
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

  return (
    <nav className="flex justify-between items-center px-8 h-[4.5rem] bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold leading-2">NextTrip.</h1>
      </div>

      {/* Center: Links */}
      <ul className="hidden md:flex gap-8 font-medium">
        <Link to="/Availableflights">
        <li className="hover:text-yellow-300 cursor-pointer transition">
          {t("Flights")}
        </li>
        </Link>
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

      {/* Right: Language + Account */}
      <div className="flex items-center gap-6">
        {/* Language */}
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

        {/* Profile dropdown */}
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
            <div className="absolute right-0 mt-3 w-72 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-50 cursor-pointer">
              {!user ? (
                <div className="flex flex-col">
                  <Link
                    to="/Login"
                    className="px-4 py-3 hover:bg-gray-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/SignUp"
                    className="px-4 py-3 hover:bg-gray-100 transition"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>

                  {/* Tickets */}
                  <div className="px-4 py-2 text-sm font-semibold text-gray-600">
                    My Tickets
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {bookings.length > 0 ? (
                      bookings.map((b) => (
                        <div
                          key={b.id}
                          className="px-4 py-2 hover:bg-gray-50 transition"
                        >
                          <div>{b.flight}</div>
                          <div className="text-xs text-gray-500">{b.date}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No tickets booked yet
                      </div>
                    )}
                  </div>

                  {/* Logout */}
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
