import api from "./api";

export const login = async (data) => {
  const response = await api.post("/login", data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout");
  return response.data;
};
export const getUser = async () => {
  const response = await api.get("/user");

  return response.data;
};

export const checkLoginStatus = async (username) => {
  const response = await api.post("/login-status", {
    username,
  });

  return response.data;
};