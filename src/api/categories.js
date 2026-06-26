import { CATEGORY_API_URL, PRESIGNED_URL_API } from "../constants/api";

export const getCategories = async () => {
  const response = await fetch(CATEGORY_API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories. Status: ${response.status}`);
  }

  return await response.json();
};

export const createCategory = async (payload) => {
  const response = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category. Status: ${response.status}`);
  }

  return await response.json();
};

export const updateCategory = async (categoryId, payload) => {
  const response = await fetch(`${CATEGORY_API_URL}/${categoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update category. Status: ${response.status}`);
  }

  return await response.json();
};

const sanitizeFileName = (fileName) =>
  fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();

export const getPresignedUrl = async (fileName) => {
  const query = new URLSearchParams({ fileName: sanitizeFileName(fileName) });
  const response = await fetch(`${PRESIGNED_URL_API}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL. Status: ${response.status}`);
  }

  return await response.json();
};

export const uploadFileToS3 = async (file, presignedUrl) => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "image/jpeg" },
  });

  if (!response.ok) {
    throw new Error(`File upload failed. Status: ${response.status}`);
  }
};

export const getUploadedKey = (presignedData, fileName) => {
  if (presignedData?.key) return presignedData.key;
  if (presignedData?.Key) return presignedData.Key;

  if (presignedData?.url) {
    try {
      return decodeURIComponent(new URL(presignedData.url).pathname.slice(1));
    } catch {
      // fall through
    }
  }

  return sanitizeFileName(fileName);
};
