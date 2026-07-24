import api from "./api";

export const uploadPropertyImage = async (propertyId, imageUrl, imagePublicId, isPrimary = false, mediaType = "image") => {
  const response = await api.post("/property-images", {
    property_id: propertyId,
    image_url: imageUrl,
    image_public_id: imagePublicId,
    is_primary: isPrimary,
    media_type: mediaType,
  });

  return response.data;
};

export const deletePropertyImage = async (imageId) => {
  const response = await api.delete(`/property-images/${imageId}`);
  return response.data;
};
