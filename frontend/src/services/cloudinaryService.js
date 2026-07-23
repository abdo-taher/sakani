import api from "./api";
import axios from "axios";

export const uploadToCloudinary = async (file, folder) => {
  // 1- نجيب الـ Signature من Laravel
  const { data } = await api.post("/cloudinary/signature", {
    folder,
  });

  // 2- نجهز البيانات
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", data.api_key);
  formData.append("timestamp", data.timestamp);
  formData.append("signature", data.signature);
  formData.append("folder", folder);

  // 3- نرفع الصورة مباشرة إلى Cloudinary
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`,
    formData
  );

return {
  secure_url: response.data.secure_url,
  public_id: response.data.public_id,
};};