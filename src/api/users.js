import { USER_API_URL } from "../constants/api";

export const getUsers = async () => {
  const response = await fetch(USER_API_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users. Status: ${response.status}`);
  }

  return await response.json();
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
