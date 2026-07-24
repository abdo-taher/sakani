import api from "./api";

export const uploadPropertyImage = async (propertyId, imageUrl, imagePublicId, isPrimary = false, mediaType = "image", imageType = "property", caption = null) => {
  const payload = {
    property_id: propertyId,
    image_url: imageUrl,
    image_public_id: imagePublicId,
    is_primary: isPrimary,
    media_type: mediaType,
    image_type: imageType,
  };
  if (caption) payload.caption = caption;

  const response = await api.post("/property-images", payload);

  return response.data;
};

export const deletePropertyImage = async (imageId) => {
  const response = await api.delete(`/property-images/${imageId}`);
  return response.data;
};
