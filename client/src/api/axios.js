import axios from "axios";

const API_URL = "https://q0smnp61-5000.uks1.devtunnels.ms";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
