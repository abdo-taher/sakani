import axios from "axios";
import dynamicConfig from "../config/dynamic";
import { ADMIN_LOGIN_TOKEN } from "../constants/constants";
import { getCached, setCache, isFresh } from "./cache";

// Get API base URL dynamically
const getApiBaseUrl = () => {
  return dynamicConfig.getConfigSync().api_url;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor to update baseURL and add auth token
api.interceptors.request.use(async (config) => {
  // Ensure we have the latest dynamic config
  try {
    const dynamicConf = await dynamicConfig.getConfig();
    config.baseURL = dynamicConf.api_url;
  } catch (error) {
    console.warn('Using fallback API URL:', error);
    config.baseURL = getApiBaseUrl();
  }
  
  // Add auth token
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      sessionStorage.clear();
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_remember");
      window.location.href = `/admin/${ADMIN_LOGIN_TOKEN}/login`;
    }

    return Promise.reject(error);
  }
);

export async function cachedGet(url, { ttl = 30000, params } = {}) {
  const key = url + (params ? JSON.stringify(params) : "");
  const cached = getCached(key);

  if (cached && isFresh(key, ttl)) {
    return cached;
  }

  const response = await api.get(url, { params });
  setCache(key, response.data);
  return response.data;
}

export default api;