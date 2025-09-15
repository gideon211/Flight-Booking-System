import api from "./axios";

// Login
export const loginUser = async (credentials) => {
  // Flask login is on "/"
  const res = await api.post("/", credentials);
  return res.data; // Flask should return JSON (not redirect) for React
};

// Signup
export const signupUser = async (userData) => {
  const res = await api.post("/signup", userData);
  return res.data;
};

// Logout
export const logoutUser = async () => {
  const res = await api.post("/logout"); // you’ll need to add /logout route in Flask
  return res.data;
};

// Get current user
export const getCurrentUser = async () => {
  const res = await api.get("/me"); // you’ll need a /me route in Flask
  return res.data;
};
