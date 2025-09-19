import api from "./axios";

// Login user
export const loginUser = async (credentials) => {
  try {
    // Send login request
    await api.post("/login", credentials);

    // Get current user from /me
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Signup user
export const signupUser = async (userData) => {
  try {
    // Send signup request
    await api.post("/signup", userData);

    // Get current user from /me
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};


export const logoutUser = async () => {
  try {
    const res = await api.post("/logout");
    return res.data;
  } catch (error) {
    throw error;
  }
};


export const getCurrentUser = async () => {
  try {
    const res = await api.get("/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};
