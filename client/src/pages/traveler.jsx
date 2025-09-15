import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const TravelerPage = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { flight, email } = location.state || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/payment", { state: { flight, email, name } });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold">Traveler Details</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full Name"
        className="border p-2 rounded w-full mt-2"
        required
      />
      <button type="submit" className="mt-4 bg-red-500 text-white px-6 py-2 rounded">
        Continue
      </button>
    </form>
  );
};

export default TravelerPage;
