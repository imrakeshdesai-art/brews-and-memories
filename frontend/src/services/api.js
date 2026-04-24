import axios from "axios";

const api = axios.create({
  baseURL: "https://brews-backend.onrender.com/api",
});

// 🔐 Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 Optional: auto logout if token invalid (PRO feature)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized → clearing token");

      localStorage.removeItem("adminToken");

      // optional reload (keeps UX clean)
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default api;