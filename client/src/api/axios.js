import axios from "axios";

const API_URL = "https://q0smnp61-5000.uks1.devtunnels.ms";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {

        const refreshResponse = await axios.post(
          `${API_URL}/refresh`,
          {},
          { withCredentials: true }
        );

      
        return api(originalRequest);
      } catch (refreshError) {
    
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
