import api from "./api";

export const loginAdmin = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  return res.data;
};

export const saveAdminToken = (token) => {
  localStorage.setItem("admin_token", token);
};

export const getAdminToken = () => {
  return localStorage.getItem("admin_token");
};

export const clearAdminToken = () => {
  localStorage.removeItem("admin_token");
};