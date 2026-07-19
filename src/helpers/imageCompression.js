import imageCompression from "browser-image-compression";

const COMPRESSIBLE_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const compressImageFile = async (file, quality = 0.7) => {
  const normalizedType = String(file?.type || "").toLowerCase().trim();

  if (!(file instanceof File) || !normalizedType.startsWith("image/")) {
    return file;
  }

  if (!COMPRESSIBLE_IMAGE_TYPES.has(normalizedType)) {
    return file;
  }

  return imageCompression(file, {
    useWebWorker: true,
    maxSizeMB: 0.1,
    initialQuality: quality,
    alwaysKeepResolution: false,
    maxIteration: 10,
    fileType: normalizedType === "image/jpg" ? "image/jpeg" : normalizedType,
  });
};