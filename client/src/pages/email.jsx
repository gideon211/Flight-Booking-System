import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const EmailPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const flight = location.state?.flight;

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/traveler", { state: { flight, email } });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold">Enter Your Email</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full mt-2"
        required
      />
      <button type="submit" className="mt-4 bg-red-500 text-white px-6 py-2 rounded">
        Continue
      </button>
    </form>
  );
};

export default EmailPage;
