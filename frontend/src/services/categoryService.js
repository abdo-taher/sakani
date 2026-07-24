import api, { cachedGet } from "./api";
import { clearCache } from "./cache";

export const getCategories = async () => {
    return cachedGet("/categories", { ttl: 60000 });
};

export const createCategory = async (data) => {
    clearCache("/categories");
    const response = await api.post("/categories", data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    clearCache("/categories");
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id) => {
    clearCache("/categories");
    await api.delete(`/categories/${id}`);
};
