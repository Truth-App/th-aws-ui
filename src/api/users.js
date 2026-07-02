import { USER_API_URL } from "../constants/api";

export const getUsers = async () => {
  try {
    const response = await fetch(USER_API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error?.message === "Failed to fetch") {
      throw new Error("Unable to reach users API. Check your network or dev server proxy.");
    }
    throw error;
  }
};

export const createUser = async (payload) => {
  const response = await fetch(USER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user. Status: ${response.status}`);
  }

  return await response.json();
};

export const updateUser = async (userId, payload) => {
  const response = await fetch(`${USER_API_URL}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user. Status: ${response.status}`);
  }

  return await response.json();
};
