import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; 

export const loginUser = async (credentials) => {
  const res = await axios.post(`${API_URL}/login`, credentials, {
    withCredentials: true, 
  });
  return res.data;
};

export const signup = async (userData) => {
  const res = await axios.post(`${API_URL}/signup`, userData);
  return res.data;
};

export const getProfile = async () => {
  const res = await axios.get(`${API_URL}/profile`, { withCredentials: true });
  return res.data;
};

export const logout = async () => {
  const res = await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  return res.data;
};
