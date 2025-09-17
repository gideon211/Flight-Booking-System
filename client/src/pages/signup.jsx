import React, { useState, useContext } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate } from 'react-router-dom';
import { signupUser } from "../api/auth";



const Signup = () => {
        const [loading, setLoading] = useState(false)
        const navigate = useNavigate();
        const [error, setError] = useState("");
        const [formData, setFormData] = useState({
            firstname: "",
            lastname:"",
            email: "",
            password: "",
            confirmPassword: "",
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
  
        };




        const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const data = await signupUser({
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            password: formData.password,
            });

            localStorage.setItem("token", data.token);
            navigate("/Home");
        } catch (err) {
            console.error("Signup error:", err);
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false); // always reset
        }
        };

  return (
        <div className='w-full h-screen flex justify-center items-center bg-[url("https://images.unsplash.com/photo-1524592714635-d77511a4834d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")] bg-cover bg-center'>
            <div className='lg:w-1/3 2xl:w-1/4 p-10 bg-white'>
                <h1 className='text-center text-3xl font-bold py-5'>
                    Welcome to <span className='text-yellow-500'>NextTrip.</span>
                </h1>

                <div className='space-y-5'>
                    <h1 className='text-xl font-semibold text-center'>SIGN UP</h1>

                    <form className='flex flex-col space-y-5' onSubmit={handleSubmit}>
                        {/* First Name */}
                        <input
                        name='firstname'
                        onChange={handleChange}
                        value={formData.firstname}
                        type="text"
                        placeholder='First Name'
                        className='outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm' 
                        />

                        {/* Last Name */}
                        <input
                        name='secondname'
                        onChange={handleChange}
                        value={formData.secondname}
                        type="text"
                        placeholder='Last Name'
                        className='outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm' 
                        />

                        {/* Email */}
                        <input
                        onChange={handleChange}
                        value={formData.email}                                        
                        name='email'
                        type="email"
                        placeholder='Email'
                        className='outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm'
                        />

                        {/* Password */}
                        <input
                        name='password'
                        onChange={handleChange}
                        value={formData.password}
                        type="password"
                        required
                        placeholder='Password'
                        className='outline-0 px-5 py-3 bg-gray-100 placeholder:text-sm'
                        />

                        {/* Confirm Password */}
                        <input
                        name='confirmPassword'
                        onChange={handleChange}
                        value={formData.confirmPassword}
                        required
                        type="password"
                        placeholder='Confirm Password'
                        className='outline-0 px-5 py-3 bg-gray-100 placeholder:text-sm'
                        />

                        {/* Terms & Conditions */}
                        <div className='flex items-center space-x-2'>
                            <input type="checkbox" id="terms" />
                            <label htmlFor="terms" className='text-sm'>
                                I agree to the <span className='font-semibold'>Terms & Conditions</span> and <span className='font-semibold'>Privacy Policy</span>
                            </label>
                        </div>

                        
                        {/* Sign Up Button */}
                        <button
                        type="submit"
                        disabled={loading}
                        className={`p-2 text-md font-semibold rounded-md cursor-pointer w-full
                        ${loading ? "bg-red-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 cursor-pointer text-white"}`}
                        >
                        {loading ? (
                        <div className="flex justify-center items-center space-x-2">
                            {/* Spinner */}
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                ></circle>
                                <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                ></path>
                            </svg>
                            <span>Signing up...</span>
                        </div>
                        ) : (
                        "Sign Up"
                        )}
                        </button>

                    </form>

                    <div className='space-y-4'>
                        <p className='text-center  font-semibold '>OR <span className='underline cursor-pointer'><Link to="/Login">LOGIN</Link></span></p>
                        <button className='w-full p-4 bg-white border shadow-md rounded-md cursor-pointer space-x-3 text-center'>
                        <FontAwesomeIcon icon={faGoogle} size="md" />
                        <span>Sign up with Google</span>
                        </button>
                        </div>
                    </div>
            </div>
        </div>  
    )
}

export default Signup
