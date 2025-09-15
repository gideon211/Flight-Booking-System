import { Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import Signup from "../pages/signup";
import Home from "../pages/Home"
import Availableflights from "../pages/Availableflights";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/Availableflights" element={<Availableflights />} />
      
    </Routes>
  );
}
