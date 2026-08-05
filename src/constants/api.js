const API_HOST =
	import.meta.env.VITE_API_HOST ||
	"https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com";

// Use absolute API host in all environments to avoid Node/Vite DNS proxy issues.
export const API_BASE_URL = API_HOST;

export const PRODUCT_API_URL = `${API_BASE_URL}/api/products`;
export const CATEGORY_API_URL = `${API_BASE_URL}/api/category`;
export const USER_API_URL = `${API_BASE_URL}/api/users`;
export const INVENTORY_API_URL = `${API_BASE_URL}/api/inventory`;
export const PRESIGNED_URL_API = `${API_BASE_URL}/api/preSignedUrl`;
export const EARNINGS_API_URL = `${API_BASE_URL}/api/earnings`;
export const STOCKS_API_URL = `${API_BASE_URL}/api/stocks`;
export const PINCODE_API_URL = `${API_BASE_URL}/api/pincode`;
export const PINCODE_UPSERT_API_URL = `${API_BASE_URL}/api/pincode`;
export const S3_BASE_URL = "https://th-app-product.s3.ap-south-2.amazonaws.com";
