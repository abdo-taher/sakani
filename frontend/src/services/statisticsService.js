import api from "./api";

export const getStatisticsData = async () => {
    const response = await api.get("/statistics");
    return response.data;
};