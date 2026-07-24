import api, { cachedGet } from "./api";
import { clearCache } from "./cache";

export const getAmenities = async () => {
    return cachedGet("/amenities", { ttl: 60000 });
};

export const createAmenity = async (data) => {
    clearCache("/amenities");
    const response = await api.post("/amenities", data);
    return response.data;
};

export const updateAmenity = async (id, data) => {
    clearCache("/amenities");
    const response = await api.put(`/amenities/${id}`, data);
    return response.data;
};

export const deleteAmenity = async (id) => {
    clearCache("/amenities");
    await api.delete(`/amenities/${id}`);
};
