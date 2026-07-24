import api from "./api";

const DASHBOARD_CACHE_KEY = "/dashboard";

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

export const getDashboardData = async () => {
    const today = getTodayKey();
    const cacheKey = `${DASHBOARD_CACHE_KEY}:${today}`;
    const stored = sessionStorage.getItem(cacheKey);

    if (stored) {
        return JSON.parse(stored);
    }

    const response = await api.get("/dashboard");
    sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
    return response.data;
};

export const refreshDashboardData = async () => {
    const today = getTodayKey();
    const cacheKey = `${DASHBOARD_CACHE_KEY}:${today}`;
    sessionStorage.removeItem(cacheKey);
    return getDashboardData();
};
