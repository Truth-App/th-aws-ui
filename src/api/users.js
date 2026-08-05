import { USER_API_URL } from "../constants/api";

const parseEnvelopeBody = (body) => {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const getApiErrorMessage = (payload, fallbackMessage) => {
  const envelopeStatusCode = Number(payload?.statusCode);
  const envelopeBody = parseEnvelopeBody(payload?.body);

  if (Number.isFinite(envelopeStatusCode) && envelopeStatusCode >= 400) {
    if (typeof envelopeBody?.message === "string" && envelopeBody.message.trim()) {
      return envelopeBody.message.trim();
    }
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
    return fallbackMessage;
  }

  if (payload?.success === false) {
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
    if (typeof envelopeBody?.message === "string" && envelopeBody.message.trim()) {
      return envelopeBody.message.trim();
    }
    return fallbackMessage;
  }

  return "";
};

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

  const data = await response.json();

  if (!response.ok) {
    const message = getApiErrorMessage(data, `Failed to create user. Status: ${response.status}`);
    throw new Error(message || `Failed to create user. Status: ${response.status}`);
  }

  const envelopeError = getApiErrorMessage(data, "Failed to create user.");
  if (envelopeError) {
    throw new Error(envelopeError);
  }

  return data;
};

export const updateUser = async (userId, payload) => {
  const response = await fetch(`${USER_API_URL}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = getApiErrorMessage(data, `Failed to update user. Status: ${response.status}`);
    throw new Error(message || `Failed to update user. Status: ${response.status}`);
  }

  const envelopeError = getApiErrorMessage(data, "Failed to update user.");
  if (envelopeError) {
    throw new Error(envelopeError);
  }

  return data;
};

export const activateDeactivateUser = async (userId, payload) => {
  const response = await fetch(`${USER_API_URL}/${userId}/activate-deactive-user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok) {
    const message = getApiErrorMessage(data, `Failed to activate/deactivate user. Status: ${response.status}`);
    throw new Error(message || `Failed to activate/deactivate user. Status: ${response.status}`);
  }

  const envelopeError = getApiErrorMessage(data, "Failed to activate/deactivate user.");
  if (envelopeError) {
    throw new Error(envelopeError);
  }
  return data;
};
