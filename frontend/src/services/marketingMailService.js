import api from "./api";

export const sendMarketingMail = async (data) => {
  const response = await api.post("/marketing/send", data);
  return response.data;
};

export const previewMarketingMail = async (data) => {
  const response = await api.post("/marketing/preview", data);
  return response.data;
};
