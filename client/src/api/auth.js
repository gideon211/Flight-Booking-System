import api from "./axios";


export const loginUser = async (credentials) => {
  await api.post("/login", credentials); 
  const res = await api.get("/me");
  return res.data;
};


export const signupUser = async (userData) => {
  await api.post("/signup", userData);
  const res = await api.get("/me");
  return res.data;
};


export const logoutUser = async () => {
  const res = await api.post("/logout");
  return res.data;
};


export const getCurrentUser = async () => {
  const res = await api.get("/me");
  return res.data;
};
