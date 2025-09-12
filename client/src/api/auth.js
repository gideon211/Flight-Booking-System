import api from "./axios";

export const loginUser = async (credentials) => {
  const res = await api.post("/", credentials);
  return res.data;
};

export const signup = async (userData) => {
  const res = await api.post("/signup", userData);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.post("/logout");
  return res.data;
};
