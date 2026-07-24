import api, { cachedGet } from "./api";
import { clearCache } from "./cache";

export const getPropertyTypes = async () => {
    return cachedGet("/property-types", { ttl: 60000 });
};

export const createPropertyType = async (data) => {
    clearCache("/property-types");
    const response = await api.post("/property-types", data);
    return response.data;
};

export const updatePropertyType = async (id, data) => {
    clearCache("/property-types");
    const response = await api.put(`/property-types/${id}`, data);
    return response.data;
};

export const deletePropertyType = async (id) => {
    clearCache("/property-types");
    await api.delete(`/property-types/${id}`);
};
