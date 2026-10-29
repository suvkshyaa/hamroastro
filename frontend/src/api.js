import axios from "axios";

// VITE SYNTAX - Use import.meta.env
const getEnv = (key, fallback) => {
  const name = key.replace(/^VITE_/, 'REACT_APP_');
  return process.env[name] || fallback;
};
// Check if running in local development environment
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

//Base URL configuration
const baseURL = getEnv(
  'VITE_API_URL', 
  isLocal ? 'http://localhost:8000' : 'https://hamroastro.com'
);

console.log("🌍 API Environment:", isLocal ? "LOCAL" : "PRODUCTION");
console.log("🔗 API Base URL:", baseURL);

const API = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Function to get CSRF cookie for Laravel Sanctum
export const getCsrfCookie = async () => {
  try {
    await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
    console.log("✅ CSRF cookie loaded");
  } catch (err) {
    console.error("❌ Failed to load CSRF cookie:", err);
  }
};

// Load token from sessionStorage on initialization
const token = sessionStorage.getItem("token");
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log("✅ Token loaded from localStorage");
}

// Request interceptor - Attach token to headers
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug log
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, {
      hasAuth: !!config.headers.Authorization
    });

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - Handle 401 errors
API.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.config.method.toUpperCase()} ${response.config.url}`, {
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.log("❌ 401 Unauthorized - Clearing session");
      
      // Clear all auth data
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("role");
      delete API.defaults.headers.common['Authorization'];
      
      // Redirect to login (avoid loop)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ Helper to set/remove auth token
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    sessionStorage.setItem("token", token);
    console.log("✅ Auth token set in API headers");
  } else {
    delete API.defaults.headers.common['Authorization'];
    sessionStorage.removeItem("token");
    console.log("🗑️ Auth token removed from API headers");
  }
};

// ✅ Export helper functions
export const getChatUsers = () => API.get("/chat-users");

export default API;