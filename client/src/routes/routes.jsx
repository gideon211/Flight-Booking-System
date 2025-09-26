import { Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import Signup from "../pages/signup";
import Home from "../pages/Home"
import Availableflights from "../pages/Availableflights";
import ItineraryPage from "../pages/Itinerary"
import EmailPage from "../pages/email";
import TravelerPage from "../pages/traveler";
import PaymentPage from "../pages/payment";
import TicketSection from "../pages/ticketsection";
import AdminFlights from "../pages/admin/pages/AdminFlights";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/Availableflights" element={<Availableflights />} />
            <Route path="/itinerary/:flightId" element={<ItineraryPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/traveler" element={<TravelerPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/ticketsection" element={<TicketSection />} />
            <Route path="/AdminFlights" element={<AdminFlights />} />
        </Routes>
    );
}
