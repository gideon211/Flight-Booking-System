import { useLocation } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const { flight, email, name } = location.state || {};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Payment</h2>
      <p>Flight: {flight?.airline}</p>
      <p>Passenger: {name}</p>
      <p>Email: {email}</p>
      <p>Total: GHS {flight?.price}</p>

      <button className="mt-4 bg-green-500 text-white px-6 py-2 rounded">
        Pay Now
      </button>
    </div>
  );
};

export default PaymentPage;
