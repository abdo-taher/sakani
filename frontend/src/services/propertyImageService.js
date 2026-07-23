import api from "./api";

export const uploadPropertyImage = async (propertyId, imageUrl, imagePublicId, isPrimary = false) => {
  const response = await api.post("/property-images", {
    property_id: propertyId,
    image_url: imageUrl,
    image_public_id: imagePublicId,
    is_primary: isPrimary,
  });

  return response.data;
};