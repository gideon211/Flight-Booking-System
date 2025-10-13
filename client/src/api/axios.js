import axios from "axios";

const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Response interceptor to refresh expired token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop on refresh
    if (originalRequest.url.includes("/refresh")) {
      return Promise.reject(error);
    }

    // Handle expired token (401) - try to refresh using httpOnly cookie
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Only try to refresh for protected endpoints, not public ones
      const publicEndpoints = ['/signup', '/login', '/hotels', '/flights/search', '/'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        originalRequest.url.includes(endpoint)
      );
      
      if (isPublicEndpoint) {
        return Promise.reject(error);
      }
      
      try {
        // Refresh token is automatically sent via httpOnly cookie
        await api.post("/refresh");
        
        // Retry original request - new access_token cookie is set automatically
        return api(originalRequest);
      } catch (refreshError) {
        // Only redirect to login if this was a user-initiated request
        // Don't redirect for automatic background requests
        if (!originalRequest.url.includes("/me")) {
          console.error("Session expired, please log in again.");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
