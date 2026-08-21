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

export const validateUserForm = ({
  user,
  canManageSupportedPincodes,
  requireDiscountRate = false,
}) => {
  if (!user.firstname.trim() || !user.lastname.trim()) {
    toast.error("Please enter first name and last name");
    return false;
  }
  //max length 50 characters
  if (user.firstname.trim().length > 50) {
    toast.error("First name must be less than 50 characters");
    return false;
  }
  if (user.lastname.trim().length > 50) {
    toast.error("Last name must be less than 50 characters");
    return false;
  }
  if (!user.email.trim()) {
    toast.error("Please enter email");
    return false;
  }
  //email 20 characters
  if (user.email.trim().length > 50) {
    toast.error("Email must be less than 50 characters");
    return false;
  }
  if (!user.mobile.trim()) {
    toast.error("Please enter mobile number");
    return false;
  }
  if (!/^\d{10}$/.test(user.mobile.trim())) {
    toast.error("Mobile number must be 10 digits");
    return false;
  }
  if (!user.role) {
    toast.error("Please select a role");
    return false;
  }
  if (!user.aadharnumber.trim()) {
    toast.error("Please enter Aadhar number");
    return false;
  }
  if (user.aadharnumber.trim().length > 12) {
    toast.error("Aadhar number must be less than 12 characters");
    return false;
  }
  if (!/^\d{12}$/.test(user.aadharnumber.trim())) {
    toast.error("Aadhar number must be 12 digits");
    return false;
  }
  if (!user.pincode.trim()) {
    toast.error("Please enter pincode");
    return false;
  }
  if (!/^\d{6}$/.test(user.pincode.trim())) {
    toast.error("Pincode must be 6 digits");
    return false;
  }
  const supportedpincodes = canManageSupportedPincodes ? user.supportedpincodes || [] : [];
  if (supportedpincodes.some((pincode) => !/^\d{6}$/.test(pincode))) {
    toast.error("Each pincode must be 6 digits");
    return false;
  }
  if (!user.address.trim()) {
    toast.error("Please enter address");
    return false;
  }
  if (requireDiscountRate) {
    const discountRate = Number(user.discountrate);
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) {
      toast.error("Discount rate must be between 0 and 100");
      return false;
    }
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
    bankname: shouldShowBankDetails(user.role) ? user.bankname?.trim() || null : null,
    accountno: shouldShowBankDetails(user.role) ? user.accountno?.trim() || null : null,
    ifsccode: shouldShowBankDetails(user.role) ? user.ifsccode?.trim() || null : null,
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
