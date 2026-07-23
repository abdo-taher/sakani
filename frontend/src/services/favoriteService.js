import api from "./api";

export const getFavorites = async () => {
  const response = await api.get("/favorites");
  return response.data;
};

export const toggleFavorite = async (propertyId) => {
  const response = await api.post("/favorites/toggle", { property_id: propertyId });
  return response.data;
};

export const addFavorite = async (propertyId) => {
  const response = await api.post("/favorites", { property_id: propertyId });
  return response.data;
};

export const removeFavorite = async (propertyId) => {
  const response = await api.delete(`/favorites/${propertyId}`);
  return response.data;
};

export const syncGuestFavorites = async (propertyIds) => {
  const response = await api.post("/favorites/sync", { property_ids: propertyIds });
  return response.data;
};
