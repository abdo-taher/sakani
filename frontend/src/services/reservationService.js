import api from "./api";

export const getReservations = async () => {
  const response = await api.get("/reservations");
  return response.data;
};

export const createReservation = async (data) => {
  const response = await api.post("/reservations", data);
  return response.data;
};

export const updateReservation = async (id, data) => {
  const response = await api.put(`/reservations/${id}`, data);
  return response.data;
};

export const deleteReservation = async (id) => {
  await api.delete(`/reservations/${id}`);
};