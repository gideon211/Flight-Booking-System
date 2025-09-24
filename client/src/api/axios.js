import axios from "axios";

const API_URL = "https://q0smnp61-5000.uks1.devtunnels.ms";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, 
    headers: {
    "Content-Type": "application/json"
    }
});


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await api.post("/refresh");
                const newAccessToken = res.data.access_token;

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return api(originalRequest); 
            } catch (refreshError) {
            console.error("Session expired, please log in again.");
            return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default api;