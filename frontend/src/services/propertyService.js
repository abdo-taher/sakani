import api, { cachedGet } from "./api";
import { clearCache } from "./cache";

export const getProperties = async () => {
  const response = await api.get("/properties");
  return response.data;
};

export const getPropertiesCached = async () => {
  return cachedGet("/properties", { ttl: 30000 });
};

export const getPropertyById = async (id) => {
  return cachedGet(`/properties/${id}`, { ttl: 30000 });
};

export const getPropertiesByCategory = async (category) => {
  return cachedGet(`/properties/category/${category}`, { ttl: 30000 });
};

export const createProperty = async (data) => {
  clearCache("/properties");
  const response = await api.post("/properties", data);
  return response.data;
};

export const updateProperty = async (id, data) => {
  clearCache("/properties");
  clearCache(`/properties/${id}`);
  const response = await api.put(`/properties/${id}`, data);
  return response.data;
};

export const deleteProperty = async (id) => {
  clearCache("/properties");
  clearCache(`/properties/${id}`);
  await api.delete(`/properties/${id}`);
};

export const changePropertyStatus = async (id, status) => {
  clearCache("/properties");
  clearCache(`/properties/${id}`);
  const response = await api.put(`/properties/${id}`, { status });
  return response.data;
};

export const markUploadComplete = async (id) => {
  clearCache("/properties");
  clearCache(`/properties/${id}`);
  const response = await api.patch(`/properties/${id}/upload-complete`);
  return response.data;
};
