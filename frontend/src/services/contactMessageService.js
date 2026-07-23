import api from "./api";

export const getContactMessages = async () => {
  const response = await api.get("/contact-messages");
  return response.data;
};

export const updateContactMessage = async (id, data) => {
  const response = await api.put(`/contact-messages/${id}`, data);
  return response.data;
};

export const deleteContactMessage = async (id) => {
  const response = await api.delete(`/contact-messages/${id}`);
  return response.data;
};