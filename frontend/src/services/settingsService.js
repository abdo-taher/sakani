import api from "./api";

export const updateAdminCredentials = async (data) => {
  const response = await api.put("/admin/credentials", data);
  return response.data;
};