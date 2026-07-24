/**
 * Extract a thumbnail frame from a video File object.
 * Returns a Promise that resolves to a JPEG Blob.
 */
export function extractVideoThumbnail(file, timeInSeconds = 0.5, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const cleanup = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(timeInSeconds, video.duration || 0.5);
      } catch {
        captureFrame();
      }
    };

    video.onseeked = () => captureFrame();

    const captureFrame = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            blob ? resolve(blob) : reject(new Error("Failed to create thumbnail blob"));
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video for thumbnail"));
    };
  });
}

/**
 * Convert a Blob to a File with a meaningful name.
 */
export function blobToFile(blob, filename) {
  return new File([blob], filename, { type: "image/jpeg" });
}
