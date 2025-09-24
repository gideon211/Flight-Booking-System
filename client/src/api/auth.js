import api from "./axios";


export const loginUser = async (credentials) => {
  try {
    await api.post("/login", credentials);
    const res = await api.get("/me");
    return res.data;
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
