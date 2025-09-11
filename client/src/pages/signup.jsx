import React, { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate } from 'react-router-dom';
import { signup } from "../api/auth";


const Signup = () => {
        const [loading, setLoading] = useState(false)
        const navigate = useNavigate();
        const [error, setError] = useState("");
        const [formData, setFormData] = useState({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
        });

        const handleChange = (e) => {
                setFormData({...formData, [e.target.name]:version.target.value})
        };


        const handleSubmit = async (e) => {
                e.preventDefault();

                if(formData.password !== formData.confirmPassword){
                        setError("Passwords do not match")
                        return;
                }

                setLoading(true)
                try {
                        const data = await signup({
                                name:formData.name,
                                email:formData.email,
                                password:formData.password,
                        });

                        localStorage.setItem("token", data.token);
                        navigate("/Home");
                }catch(err){
                        setError(err.response?.data.message || "Signup failed")
                }
        };
  return (
        <div className='w-full h-screen flex justify-center items-center bg-[url("https://images.unsplash.com/photo-1524592714635-d77511a4834d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")] bg-cover bg-center'>
                <div className='lg:w-1/3 2xl:w-1/4 p-10 bg-white'>
                        <h1 className='text-center text-3xl font-bold py-5'>
                        Welcome to <span className='text-purple-500'>AFA Airlines</span>
                        </h1>

                        <div className='space-y-5'>
                                <h1 className='text-xl font-semibold text-center'>SIGN UP</h1>

                                <form className='flex flex-col space-y-5' onSubmit={handleSubmit}>
                                        {/* Full Name */}
                                        <input
                                        onChange={handleChange}
                                        value={formData.name}
                                        type="text"
                                        placeholder='Full Name'
                                        className='outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm' 
                                        />

                                        {/* Email */}
                                        <input
                                        onChange={handleChange}
                                        value={formData.email}                                        
                                        
                                        type="email"
                                        placeholder='Email'
                                        className='outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm'
                                        />

                                        {/* Password */}
                                        <input
                                        onChange={handleChange}
                                        value={formData.password}
                                        type="password"
                                        required
                                        placeholder='Password'
                                        className='outline-0 px-5 py-3 bg-gray-100 placeholder:text-sm'
                                        />

                                        {/* Confirm Password */}
                                        <input
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
                                        type='submit'
                                        className='p-2 bg-purple-500 text-md text-white font-semibold rounded-md cursor-pointer hover:bg-purple-600'>
                                        Sign Up
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
