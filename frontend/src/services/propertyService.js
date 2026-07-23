import api from "./api";

export const getProperties = async () => {
  const response = await api.get("/properties");
  return response.data;
};

export const getPropertiesByCategory = async (category) => {
  const response = await api.get(`/properties/category/${category}`);
  return response.data;
};

export const createProperty = async (data) => {
  const response = await api.post("/properties", data);
  return response.data;
};

export const updateProperty = async (id, data) => {
  const response = await api.put(`/properties/${id}`, data);
  return response.data;
};

export const deleteProperty = async (id) => {
  await api.delete(`/properties/${id}`);
};

export const changePropertyStatus = async (id, status) => {
  const response = await api.put(`/properties/${id}`, { status });
  return response.data;
};