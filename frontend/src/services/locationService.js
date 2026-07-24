import api, { cachedGet } from "./api";
import { clearCache } from "./cache";

export const getLocations = async () => {
    return cachedGet("/locations", { ttl: 60000 });
};

export const createLocation = async (data) => {
    clearCache("/locations");
    const response = await api.post("/locations", data);
    return response.data;
};

export const updateLocation = async (id, data) => {
    clearCache("/locations");
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
};

export const deleteLocation = async (id) => {
    clearCache("/locations");
    await api.delete(`/locations/${id}`);
};
