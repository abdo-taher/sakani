import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// إرسال الـ Token تلقائياً
api.interceptors.request.use((config) => {
const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isLoginRequest = error.config?.url?.includes("/login");

if (error.response?.status === 401 && !isLoginRequest) {
  sessionStorage.clear();
  window.location.href = "/admin/login";
}

    return Promise.reject(error);
  }
);
export default api;