import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { flight, email, traveler } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
        bankName: "",
        bankAccount: "",
        depositRef: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Get booking details from location state
            const bookingDetails = location.state?.bookingDetails || {};
            const totalAmount = bookingDetails.totalPrice || flight.price;

            // Call booking API with payment information
            const bookingData = {
                flight_id: flight.flight_id,
                first_name: traveler?.firstName || "",
                last_name: traveler?.lastName || "",
                email: email,
                phone: formData.phone || "",
                num_seats: bookingDetails.numSeats || 1,
                cabin_class: bookingDetails.selectedClass || flight.cabin_class,
                extra_baggage: bookingDetails.extraBaggage || 0,
                meal_preference: bookingDetails.mealPreference || 'Standard',
                payment_method: method,
                payment_amount: totalAmount,
                payment_details: {
                    card_name: method === 'card' ? formData.cardName : null,
                    momo_provider: method === 'momo' ? formData.momoProvider : null,
                    momo_number: method === 'momo' ? formData.momoNumber : null,
                    deposit_ref: method === 'bank' ? formData.depositRef : null,
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                        country: formData.country
                    }
                }
            };

            const response = await api.post("/bookflight", bookingData);

            if (response.data) {
                // Navigate to success page with booking details
                navigate("/ticketsection", {
                    state: {
                        booking: response.data.booking,
                        payment: response.data.payment,
                        flight,
                        traveler,
                        email,
                        paymentMethod: method,
                        totalAmount
                    }
                });
            }
        } catch (err) {
            console.error("Booking error:", err);
            setError(err.response?.data?.message || "Booking failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
            
            <div className="bg-blue-500 text-white px-4 py-2 rounded-t-lg font-medium -mx-6 -mt-6 mb-6">
                    4. Payment Methods <span className="font-normal">Safe Secured</span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

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
                                    <option value="MTN">MTN Mobile Money</option>
                                    <option value="Vodafone">Vodafone Cash</option>
                                    <option value="AirtelTigo">AirtelTigo Money</option>
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
                                    placeholder="024XXXXXXX or 055XXXXXXX"
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1 placeholder:text-sm placeholder:text-gray-300"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter your registered mobile money number</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">
                                    Country <span className="text-red-500">(Mandatory)</span>
                                </label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                                    required
                                >
                                    <option value="Ghana">Ghana</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="Kenya">Kenya</option>
                                    <option value="Uganda">Uganda</option>
                                    <option value="Tanzania">Tanzania</option>
                                </select>
                            </div>
                        </>
                    )}

                    {method === "bank" && (
                        <>
                            <div>
                                <label className="block text-sm font-medium">
                                    Bank Name <span className="text-red-500">(Mandatory)</span>
                                </label>
                                <select
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                                    required
                                >
                                    <option value="">Select Bank</option>
                                    <option value="GCB Bank">GCB Bank</option>
                                    <option value="Ecobank Ghana">Ecobank Ghana</option>
                                    <option value="Stanbic Bank">Stanbic Bank</option>
                                    <option value="Absa Bank">Absa Bank</option>
                                    <option value="Fidelity Bank">Fidelity Bank</option>
                                    <option value="Zenith Bank">Zenith Bank</option>
                                    <option value="Access Bank">Access Bank</option>
                                    <option value="Guaranty Trust Bank">Guaranty Trust Bank (GTBank)</option>
                                    <option value="Standard Chartered">Standard Chartered</option>
                                    <option value="CalBank">CalBank</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">
                                    Bank Account Number <span className="text-red-500">(Mandatory)</span>
                                </label>
                                <input
                                    type="text"
                                    name="bankAccount"
                                    value={formData.bankAccount}
                                    onChange={handleChange}
                                    placeholder="Enter your account number"
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Account number used for the deposit</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">
                                    Deposit Reference Number <span className="text-red-500">(Mandatory)</span>
                                </label>
                                <input
                                    type="text"
                                    name="depositRef"
                                    value={formData.depositRef}
                                    onChange={handleChange}
                                    placeholder="e.g., TXN123456789"
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Transaction reference from your bank deposit slip</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">
                                    Country <span className="text-red-500">(Mandatory)</span>
                                </label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full border-2 border-blue-200 outline-none rounded p-2 mt-1"
                                    required
                                >
                                    <option value="Ghana">Ghana</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="Kenya">Kenya</option>
                                    <option value="South Africa">South Africa</option>
                                    <option value="Uganda">Uganda</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Address Fields - Only for Card and Bank payments */}
                    {(method === "card" || method === "bank") && (
                        <>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Billing Address</h3>
                    </div>
                    
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
                            <option>Nigeria</option>
                            <option>Kenya</option>
                            <option>USA</option>
                            <option>UK</option>
                        </select>
                    </div>
                    </>
                    )}

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
