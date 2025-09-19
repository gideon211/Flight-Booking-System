import { useLocation } from "react-router-dom";
import { useState } from "react";

const PaymentPage = () => {
    const location = useLocation();
    const { flight, email, name } = location.state || {};
    const [loading, setLoading] = useState(false);

    const [method, setMethod] = useState("card");
    const [formData, setFormData] = useState({
        cardName: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
        email: email || "",
        phone: "",
        address: "",
        street: "",
        city: "",
        state: "",
        country: "Ghana",
        zip: "",
        momoProvider: "",
        momoNumber: "",
        depositRef: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Payment initiated with method: ${method}\nDetails: ${JSON.stringify(formData, null, 2)}`);
    };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        
      <div className="bg-blue-500 text-white px-4 py-2 rounded-t-lg font-medium -mx-6 -mt-6 mb-6">
            4. Payment Methods <span className="font-normal">Safe Secured</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
            <button
            onClick={() => setMethod("card")}
            className={`flex-1 border-none p-2 rounded ${
                method === "card" ? "bg-blue-200 shadow font-medium" : "bg-gray-100"
            }`}
            >
            Credit/Debit Card
            </button>
            <button
            onClick={() => setMethod("momo")}
            className={`flex-1  border-none p-2 rounded ${
                method === "momo" ? "bg-blue-200 shadow font-medium " : "bg-gray-100"
            }`}
            >
            Mobile Money
            </button>
            <button
            onClick={() => setMethod("bank")}
            className={`flex-1 border-none p-2 rounded ${
                method === "bank" ? "bg-blue-200 shadow font-medium" : "bg-gray-100"
            }`}
            >
            Bank Deposit
            </button>
      </div>

      
      <form onSubmit={handleSubmit} className="space-y-4">
        




            {method === "card" && (
            <>
                <div>
                    <label className="block text-sm font-medium">
                        Card Holder Name <span className="text-red-500">(Mandatory)</span>
                    </label>
                    <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className="w-full  border-2 border-blue-200 outline-none rounded p-2 mt-1"
                        required
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium">
                        Card Number <span className="text-red-500">(Mandatory)</span>
                    </label>
                    <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                        required
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Expiry Date</label>
                            <input
                            type="text"
                            name="expiry"
                            value={formData.expiry}
                            onChange={handleChange}
                            placeholder="MM/YY"
                            className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                            required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CVV</label>
                            <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleChange}
                            placeholder="123"
                            className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                            required
                            />
                        </div>
                    </div>
            </>
            )}

            {method === "momo" && (
            <>
                <div>
                <label className="block text-sm font-medium">
                    MoMo Provider <span className="text-red-500">(Mandatory)</span>
                </label>
                <select
                    name="momoProvider"
                    value={formData.momoProvider}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                >
                    <option value="">Select Provider</option>
                    <option value="MTN">MTN</option>
                    <option value="Vodafone">Vodafone</option>
                    <option value="AirtelTigo">AirtelTigo</option>
                </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        MoMo Number <span className="text-red-500">(Mandatory)</span>
                    </label>
                    <input
                        type="tel"
                        name="momoNumber"
                        value={formData.momoNumber}
                        onChange={handleChange}
                        placeholder="05XXXXXXXX"
                        className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1 placeholder:text-sm placeholder:text-gray-300"
                        required
                    />
                </div>
            </>
            )}

            {method === "bank" && (
            <>
                <div>
                    <label className="block text-sm font-medium">
                        Deposit Reference <span className="text-red-500">(Mandatory)</span>
                    </label>
                    <input
                        type="text"
                        name="depositRef"
                        value={formData.depositRef}
                        onChange={handleChange}
                        className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                        required
                    />
                </div>

                {/* <div>
                    <label className="block text-sm font-medium">Upload Deposit Slip (optional)</label>
                    <input
                        type="file"
                        name="depositSlip"
                        className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    />
                </div> */}
            </>
            )}

            {/* Address Fields */}
            {/* <div>
                <label className="block text-sm font-medium">
                    Address <span className="text-red-500">(Mandatory)</span>
                </label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                />
            </div> */}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Street</label>
                    <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">City</label>
                    <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">State</label>
                    <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Zip Code</label>
                    <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Country</label>
                <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                    required
                >
                    <option>Ghana</option>
                    <option>USA</option>
                    <option>UK</option>
                </select>
            </div>

            <p className="text-xs text-gray-600 mt-4">
            By clicking on the Make Payment button below, I understand and agree
            with rules and restrictions of this fare and the{" "}
            <span className="text-blue-600 underline cursor-pointer">
                Terms of Use
            </span>{" "}
            and{" "}
            <span className="text-blue-600 underline cursor-pointer">
                Privacy Policy
            </span>
            .
            </p>

        <button
        disabled={loading}
        type="submit"
        className={`mt-4 px-6 py-2 font-medium rounded 
            ${loading ? "bg-gray-400 cursor-not-allowed text-black" : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"}`}
        >
        {loading ? "Please wait..." : "MAKE PAYMENT"}
        </button>

            
      </form>
    </div>
  );
};

export default PaymentPage;
