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

/** Validate + normalize create payload before API (avoids DynamoDB GSI null pincode / burned sequences). */
export const validateCreateUserPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("User payload is required");
  }

  const firstname = String(payload.firstname ?? payload.firstName ?? "").trim();
  const lastname = String(payload.lastname ?? payload.lastName ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const mobile = String(payload.mobile ?? "").trim();
  const role = String(payload.role ?? "").trim();
  const aadharnumber = String(payload.aadharnumber ?? payload.aadharNumber ?? "").trim();
  const address = String(payload.address ?? "").trim();
  const pincode = String(payload.pincode ?? "").trim();

  if (!firstname || !lastname) {
    throw new Error("Please enter first name and last name");
  }
  if (firstname.length > 50) {
    throw new Error("First name must be less than 50 characters");
  }
  if (lastname.length > 50) {
    throw new Error("Last name must be less than 50 characters");
  }
  if (!email) {
    throw new Error("Please enter email");
  }
  if (email.length > 50) {
    throw new Error("Email must be less than 50 characters");
  }
  if (!mobile) {
    throw new Error("Please enter mobile number");
  }
  if (!/^\d{10}$/.test(mobile)) {
    throw new Error("Mobile number must be 10 digits");
  }
  if (!role) {
    throw new Error("Please select a role");
  }
  if (!aadharnumber) {
    throw new Error("Please enter Aadhar number");
  }
  if (!/^\d{12}$/.test(aadharnumber)) {
    throw new Error("Aadhar number must be 12 digits");
  }
  if (!address) {
    throw new Error("Please enter address");
  }
  // GSI `pincode` expects String — never send null/empty
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error("Pincode is required and must be 6 digits");
  }

  const supportedpincodes = Array.isArray(payload.supportedpincodes)
    ? payload.supportedpincodes.map((code) => String(code).trim()).filter(Boolean)
    : [];
  if (supportedpincodes.some((code) => !/^\d{6}$/.test(code))) {
    throw new Error("Each supported pincode must be 6 digits");
  }

  return {
    ...payload,
    firstname,
    lastname,
    email,
    mobile,
    role,
    aadharnumber,
    address,
    landmark: String(payload.landmark ?? "").trim(),
    pincode,
    supportedpincodes,
    referencenumber: String(payload.referencenumber ?? payload.referenceNumber ?? "").trim(),
  };
};

/** Remove null/undefined so DynamoDB GSI keys never receive NULL. */
const omitNullish = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== null && value !== undefined),
  );

export const createUser = async (payload) => {
  const validatedPayload = omitNullish(validateCreateUserPayload(payload));

  const response = await fetch(USER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedPayload),
  });

  let data = null;
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        "Create user failed (server error). Check Lambda CloudWatch logs — usually a DynamoDB ValidationException or unhandled throw in createUser.",
      );
    }
    const message = getApiErrorMessage(data, `Failed to create user. Status: ${response.status}`);
    throw new Error(message || rawText || `Failed to create user. Status: ${response.status}`);
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
