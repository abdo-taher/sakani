import api from "./api";

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.post("/settings/bulk", { settings: data });
  return response.data;
};

export const updateAdminCredentials = async (data) => {
  const response = await api.put("/admin/credentials", data);
  return response.data;
};