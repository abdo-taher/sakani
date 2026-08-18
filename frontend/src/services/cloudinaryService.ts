import { ApiService } from './apiService';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads media to Cloudflare R2 via the backend storage service.
 * Named uploadToCloudinary / uploadMedia for backwards compatibility with existing UI components.
 */
export const uploadToCloudinary = async (
  file: File, 
  folder: string = 'sakani/rooms/images'
): Promise<CloudinaryUploadResult> => {
  // 1. Try Cloudflare R2 Upload through Laravel backend
  try {
    const res = await ApiService.uploadMedia(file, folder);
    if (res && res.url) {
      return {
        secure_url: res.url,
        public_id: res.key || res.public_id || `r2-${Date.now()}`,
      };
    }
  } catch (e) {
    console.warn('Backend R2 media upload fallback:', e);
  }

  // 2. Fallback to direct Cloudinary signature if backend R2 was unreachable
  try {
    const signRes = await ApiService.getCloudinarySignature(folder);
    const data = signRes.data || signRes;

    if (data && data.cloud_name && data.signature) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', data.api_key);
      formData.append('timestamp', String(data.timestamp));
      formData.append('signature', data.signature);
      formData.append('folder', folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${data.cloud_name}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        return {
          secure_url: uploadData.secure_url,
          public_id: uploadData.public_id,
        };
      }
    }
  } catch (e) {}

  // 3. Fallback to local Data URL preview if completely offline
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        secure_url: reader.result as string,
        public_id: `local-${Date.now()}`,
      });
    };
    reader.readAsDataURL(file);
  });
};
