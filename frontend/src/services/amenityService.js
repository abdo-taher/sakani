import api from "./api";

export const getAmenities = async () => {
    const response = await api.get("/amenities");
    return response.data;
};

export const createAmenity = async (data) => {
    const response = await api.post("/amenities", data);
    return response.data;
};

export const updateAmenity = async (id, data) => {
    const response = await api.put(`/amenities/${id}`, data);
    return response.data;
};

export const deleteAmenity = async (id) => {
    await api.delete(`/amenities/${id}`);
};