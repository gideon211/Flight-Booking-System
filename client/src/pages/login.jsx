import { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import Loader from "../components/Loader"
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] =useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setUser } = useContext(AuthContext);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await loginUser({email, password});
            // Tokens are stored in httpOnly cookies by the backend
            // Just update the user state
            setUser(data.user);
            
            // Redirect based on user role
            if (data.user.role === "admin") {
                navigate("/admin-dashboard");
            } else if (data.user.role === "superadmin") {
                navigate("/superadmin-dashboard");
            } else {
                navigate("/user-dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed")
    
        }finally{
            setLoading(false);
        }
    };

    return (
        <div className='w-full h-screen bg-gray-100 flex justify-center items-center bg-[url("https://images.unsplash.com/photo-1549897411-b06572cdf806?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")] bg-cover bg-center'>
            <div className='lg:w-1/3 2xl:w-1/4 p-10 bg-white'>
                <h1 className='text-center text-3xl font-bold py-5'>
                    Welcome to <span 
                        className='text-yellow-500 cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={() => navigate("/")}
                    >
                        NextTrip.
                    </span>
                </h1>
                <div className='space-y-5'>

                    <h1 className='text-xl font-semibold text-center'>
                        LOGIN
                    </h1>
                    {error && <p className="text-red-500 mb-2">{error}</p>}

                    <form
                        onSubmit={handleLogin} 
                        className='flex flex-col space-y-5'>
                        <input
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        type="email" placeholder='Email' className='outline-0 px-5 py-2 bg-gray-100' />
                        <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        type="password" placeholder='Password' className='outline-0 px-5 py-2 bg-gray-100 accent-yellow-100' />
                        <div className='flex justify-between items-center'>
                            <div className='flex items-center space-x-2'>
                                <input type="checkbox" name="" id="" />
                                <p className='text-sm'>Remember Me</p>

                            </div>

                            <a href="/" className='text-sm'>Forget Password?</a>
                        </div>

                        <button
                        type='submit'
                        disabled={loading}
                        className={`p-2 t font-semibold rounded-md 
                        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"}`}
                        >
                        {loading ? "Logging in.." : "Sign In"}
                        </button>

                        <p className='text-sm text-center'><span className='font-semibold'>Terms & Conditions</span> and <span className='font-semibold'>Privacy</span></p>
                    </form>

                    <div className='space-y-5'>
                        <p className='text-center text-sm font-medium'>OR SIGN UP <span className='font-semibold underline cursor-pointer'><Link to="/signup">HERE</Link></span></p>

                    </div>


                </div>

            </div>
                

        </div>
    )
}

export default login