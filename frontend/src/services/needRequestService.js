import api from "./api";

// إنشاء طلب جديد (العميل)
export const createNeedRequest = async (data) => {
  const response = await api.post("/need-requests", data);
  return response.data;
};

// جلب كل الطلبات (الأدمن)
export const getNeedRequests = async () => {
  const response = await api.get("/need-requests");
  return response.data;
};

// تحديث الطلب
export const updateNeedRequest = async (id, data) => {
  const response = await api.put(`/need-requests/${id}`, data);
  return response.data;
};

// حذف الطلب
export const deleteNeedRequest = async (id) => {
  await api.delete(`/need-requests/${id}`);
};