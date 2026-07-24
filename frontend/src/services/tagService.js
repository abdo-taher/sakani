import api from "./api";
import { clearCache } from "./cache";

export const getTags = async () => {
  const response = await api.get("/tags");
  return response.data;
};

export const createTag = async (data) => {
  clearCache("/tags");
  const response = await api.post("/tags", data);
  return response.data;
};

export const updateTag = async (id, data) => {
  clearCache("/tags");
  const response = await api.put(`/tags/${id}`, data);
  return response.data;
};

export const deleteTag = async (id) => {
  clearCache("/tags");
  await api.delete(`/tags/${id}`);
};
