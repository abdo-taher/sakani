import api from "./api";
import { clearCache } from "./cache";

export const createRoom = async (propertyId, data) => {
  clearCache(`/properties/${propertyId}`);
  const response = await api.post(`/properties/${propertyId}/rooms`, data);
  return response.data;
};

export const updateRoom = async (id, data) => {
  const response = await api.put(`/rooms/${id}`, data);
  return response.data;
};

export const deleteRoom = async (id, propertyId) => {
  if (propertyId) clearCache(`/properties/${propertyId}`);
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};

export const uploadRoomImage = async (roomId, data) => {
  const response = await api.post(`/rooms/${roomId}/images`, data);
  return response.data;
};

export const deleteRoomImage = async (imageId) => {
  const response = await api.delete(`/room-images/${imageId}`);
  return response.data;
};

export const markRoomUploadComplete = async (roomId) => {
  const response = await api.patch(`/rooms/${roomId}/upload-complete`);
  return response.data;
};
