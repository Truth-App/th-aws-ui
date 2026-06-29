import { INVENTORY_API_URL } from "../constants/api";

export const getInventory = async () => {
  const response = await fetch(INVENTORY_API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory. Status: ${response.status}`);
  }

  return await response.json();
};

export const createInventory = async (payload) => {
  const response = await fetch(INVENTORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `Failed to create inventory. Status: ${response.status}`,
    );
  }

  return await response.json();
};

export const updateInventory = async (inventoryId, payload) => {
  const response = await fetch(`${INVENTORY_API_URL}/${inventoryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `Failed to update inventory. Status: ${response.status}`,
    );
  }

  return await response.json();
};
