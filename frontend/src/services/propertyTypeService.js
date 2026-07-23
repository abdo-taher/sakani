import api from "./api";

export const getPropertyTypes = async () => {
    const response = await api.get("/property-types");
    return response.data;
};

export const createPropertyType = async (data) => {
    const response = await api.post("/property-types", data);
    return response.data;
};

export const updatePropertyType = async (id, data) => {
    const response = await api.put(`/property-types/${id}`, data);
    return response.data;
};

export const deletePropertyType = async (id) => {
    await api.delete(`/property-types/${id}`);
};