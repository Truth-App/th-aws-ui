import { toast } from "react-toastify";
import { PRESIGNED_URL_API } from "../../constants/api";
import { getDefaultPrivilegeIdsByRole } from "../../constants/dashboardFeatures";
import {
  buildActivityLogPayload,
  getActivityLog,
  normalizeUserStatus,
  shouldShowBankDetails,
} from "./userManagementUtils";

export const sanitizeFileName = (fileName) =>
  fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();

export const getPresignedUrl = async (fileName) => {
  const sanitized = sanitizeFileName(fileName);
  const query = new URLSearchParams({ fileName: sanitized });
  const response = await fetch(`${PRESIGNED_URL_API}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.status}`);
  }
  return response.json();
};

export const uploadFileToS3 = async (file, presignedUrl) => {
  const fileType = file.type || "image/jpeg";
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": fileType },
  });
  if (!response.ok) {
    throw new Error(`File upload failed with status ${response.status}`);
  }
};

/** Returns field-level errors for mandatory user form fields. Empty object = valid. */
export const getUserFormFieldErrors = ({
  user,
  canManageSupportedPincodes = false,
  requireDiscountRate = false,
}) => {
  const errors = {};
  const firstname = String(user?.firstname ?? "").trim();
  const lastname = String(user?.lastname ?? "").trim();
  const email = String(user?.email ?? "").trim();
  const mobile = String(user?.mobile ?? "").trim();
  const role = String(user?.role ?? "").trim();
  const aadharnumber = String(user?.aadharnumber ?? "").trim();
  const pincode = String(user?.pincode ?? "").trim();
  const address = String(user?.address ?? "").trim();

  if (!firstname) errors.firstname = "First name is required";
  else if (firstname.length > 50) errors.firstname = "First name must be less than 50 characters";

  if (!lastname) errors.lastname = "Last name is required";
  else if (lastname.length > 50) errors.lastname = "Last name must be less than 50 characters";

  if (!email) errors.email = "Email is required";
  else if (email.length > 50) errors.email = "Email must be less than 50 characters";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";

  if (!mobile) errors.mobile = "Mobile number is required";
  else if (!/^\d{10}$/.test(mobile)) errors.mobile = "Mobile number must be 10 digits";

  if (!role) errors.role = "Please select a role";

  if (!aadharnumber) errors.aadharnumber = "Aadhar number is required";
  else if (!/^\d{12}$/.test(aadharnumber)) errors.aadharnumber = "Aadhar number must be 12 digits";

  if (!pincode) errors.pincode = "Pincode is required";
  else if (!/^\d{6}$/.test(pincode)) errors.pincode = "Pincode must be 6 digits";

  if (!address) errors.address = "Address is required";

  const supportedpincodes = canManageSupportedPincodes ? user?.supportedpincodes || [] : [];
  if (supportedpincodes.some((code) => !/^\d{6}$/.test(String(code).trim()))) {
    errors.supportedpincodes = "Each supported pincode must be 6 digits";
  }

  if (requireDiscountRate) {
    const discountRate = Number(user?.discountrate);
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) {
      errors.discountrate = "Discount rate must be between 0 and 100";
    }
  }

  return errors;
};

/** Validates mandatory fields. Shows toast and returns false if invalid — call before any save API. */
export const validateUserForm = ({
  user,
  canManageSupportedPincodes,
  requireDiscountRate = false,
}) => {
  const errors = getUserFormFieldErrors({
    user,
    canManageSupportedPincodes,
    requireDiscountRate,
  });
  const firstError = Object.values(errors)[0];
  if (firstError) {
    toast.error(firstError);
    return false;
  }
  return true;
};

export const buildUserSavePayload = ({
  user,
  canManageSupportedPincodes,
  isProfileMode,
  isEditMode,
  isCurrentUserAdmin,
  existingUser,
  modifiedBy,
}) => {
  const supportedpincodes = canManageSupportedPincodes ? user.supportedpincodes || [] : [];

  const payload = {
    firstname: user.firstname.trim(),
    lastname: user.lastname.trim(),
    email: user.email.trim(),
    mobile: user.mobile.trim(),
    referencenumber: user.referencenumber.trim(),
    role: user.role,
    aadharnumber: user.aadharnumber.trim(),
    address: user.address.trim(),
    landmark: user.landmark.trim(),
    pincode: user.pincode.trim(),
    supportedpincodes,
    // Use empty strings — DynamoDB GSIs reject NULL attribute values (causes Lambda 502).
    bankname: shouldShowBankDetails(user.role) ? user.bankname?.trim() || "" : "",
    accountno: shouldShowBankDetails(user.role) ? user.accountno?.trim() || "" : "",
    ifsccode: shouldShowBankDetails(user.role) ? user.ifsccode?.trim() || "" : "",
    imageKeys: user.imageKeys || [],
    images: user.imageKeys || [],
    activitylog: user.activitylog || [],
  };

  if (isProfileMode) {
    const resolvedPrivileges =
      user.privileges?.length > 0
        ? user.privileges
        : getDefaultPrivilegeIdsByRole(user.role);
    payload.privileges = resolvedPrivileges;
  } else {
    payload.privileges = user.privileges || [];
  }

  payload.discountrate = Math.min(100, Math.max(0, Number(user.discountrate) || 0));

  let nextStatus = "Active";
  let previousStatus = "Active";

  if (isEditMode) {
    const previousRole = existingUser?.role || "";
    const previousReferenceNumber =
      existingUser?.referencenumber || existingUser?.referenceNumber || "";
    const nextReferenceNumber = user.referencenumber.trim();
    const referenceChanged =
      nextReferenceNumber !== String(previousReferenceNumber || "").trim();

    previousStatus = normalizeUserStatus(existingUser?.status || user.status);
    if (isCurrentUserAdmin) {
      nextStatus = normalizeUserStatus(user.status);
    } else if (referenceChanged && nextReferenceNumber) {
      nextStatus = "Inactive";
    } else {
      nextStatus = previousStatus;
    }

    payload.status = nextStatus;
    payload.activitylog = buildActivityLogPayload({
      existingHistory: getActivityLog(existingUser || user),
      previousRole,
      previousReferenceNumber,
      nextRole: user.role,
      nextReferenceNumber,
      modifiedBy,
    });
  } else {
    // Create: entering a reference number marks the user Inactive.
    const hasReferenceNumber = Boolean(String(user.referencenumber || "").trim());
    if (hasReferenceNumber) {
      nextStatus = "Inactive";
    } else if (isCurrentUserAdmin) {
      nextStatus = normalizeUserStatus(user.status);
    } else {
      nextStatus = "Active";
    }
    payload.status = nextStatus;
  }

  return { payload, nextStatus, previousStatus };
};
