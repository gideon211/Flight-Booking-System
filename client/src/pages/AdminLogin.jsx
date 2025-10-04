import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminPortalLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/login", formData); // Flask login route
      const { user, access_token } = res.data;

      // store auth
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("access_token", access_token);

      // role-based redirects
      if (user.role === "superadmin") {
        navigate("/superadmin-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        setError("Not authorized for admin portal");
      }
    } catch (err) {
      setError("Login failed. Check your credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          Admin / SuperAdmin Login
        </h2>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 outline-none"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 outline-none"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminPortalLogin;
