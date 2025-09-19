import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signupUser } from "../api/auth"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGoogle } from "@fortawesome/free-brands-svg-icons"

const Signup = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError("")

    try {
      const data = await signupUser({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        confirmpassword: formData.confirmPassword,
      })

      localStorage.setItem("token", data.token)
      navigate("/Home")
    } catch (err) {
      console.error("Signup error:", err)
      setError(err.response?.data?.message || err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex justify-center items-center bg-[url('https://images.unsplash.com/photo-1524592714635-d77511a4834d?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center">
      <div className="lg:w-1/3 2xl:w-1/4 p-10 bg-white">
        <h1 className="text-center text-3xl font-bold py-5">
          Welcome to <span className="text-yellow-500">NextTrip.</span>
        </h1>

        <div className="space-y-5">
          <h1 className="text-xl font-semibold text-center">SIGN UP</h1>
          {error && <p className="text-red-500 mb-2">{error}</p>}

          <form className="flex flex-col space-y-5" onSubmit={handleSubmit}>
            <input
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              type="text"
              placeholder="First Name"
              className="outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm"
            />

            <input
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              type="text"
              placeholder="Last Name"
              className="outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm"
            />

            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Email"
              className="outline-0 px-5 py-2 bg-gray-100 placeholder:text-sm"
            />

            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type="password"
              required
              placeholder="Password"
              className="outline-0 px-5 py-3 bg-gray-100 placeholder:text-sm"
            />

            <input
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type="password"
              required
              placeholder="Confirm Password"
              className="outline-0 px-5 py-3 bg-gray-100 placeholder:text-sm"
            />

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms" className="text-sm">
                I agree to the <span className="font-semibold">Terms & Conditions</span> and <span className="font-semibold">Privacy Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`p-2 text-md font-semibold rounded-md w-full 
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"}`}
            >
              {loading ? (
                <div className="flex justify-center items-center space-x-2">
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Signing up...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="space-y-4">
            <p className="text-center font-semibold">
              OR <Link to="/Login" className="underline">LOGIN</Link>
            </p>
            <button className="w-full p-4 bg-white border shadow-md rounded-md flex justify-center items-center space-x-3">
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
