import api from "./axios";


export const loginUser = async (credentials) => {
    try {
        // Login sets httpOnly cookies automatically
        const loginRes = await api.post("/login", credentials);
        // Return user data from login response
        return loginRes.data;
    } catch (error) {
        throw error;
    }
};

export const signupUser = async (userData) => {
  try {
        await api.post("/signup", userData);
        const res = await api.get("/me");
        return res.data;
    } catch (error) {
    throw error;
    }
};



export const logoutUser = async () => {
  try {
    // Logout clears httpOnly cookies on the backend
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
