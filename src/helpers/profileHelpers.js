import { getDefaultPrivilegeIdsByRole } from "../constants/dashboardFeatures";
import { ADMIN_ROLE } from "../constants/roles";

const PROFILE_SKIP_KEY = "th_profile_setup_skipped";
const POST_LOGIN_SETUP_KEY = "th_post_login_setup";

export const markPostLoginSetup = () => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(POST_LOGIN_SETUP_KEY, "1");
};

export const consumePostLoginSetup = () => {
  if (typeof sessionStorage === "undefined") return false;
  const shouldSetup = sessionStorage.getItem(POST_LOGIN_SETUP_KEY) === "1";
  if (shouldSetup) {
    sessionStorage.removeItem(POST_LOGIN_SETUP_KEY);
  }
  return shouldSetup;
};

export const hasSkippedProfileSetup = (userId) => {
  if (!userId || typeof localStorage === "undefined") return false;
  return localStorage.getItem(`${PROFILE_SKIP_KEY}_${userId}`) === "true";
};

export const markProfileSetupSkipped = (userId) => {
  if (!userId || typeof localStorage === "undefined") return;
  localStorage.setItem(`${PROFILE_SKIP_KEY}_${userId}`, "true");
};

export const buildGoogleUserPayload = (authUser) => {
  const nameParts = (authUser?.name || "").trim().split(/\s+/).filter(Boolean);
  const defaultPrivileges = getDefaultPrivilegeIdsByRole("Customer");

  return {
    firstname: nameParts[0] || "",
    lastname: nameParts.slice(1).join(" "),
    email: (authUser?.email || "").trim(),
    mobile: "",
    referencenumber: "",
    role: "Customer",
    aadharnumber: "",
    address: "",
    landmark: "",
    pincode: "",
    supportedpincodes: [],
    imageKeys: [],
    imagekeys: [],
    images: [],
    privileges: defaultPrivileges,
    discountrate: 0,
    accountno: "",
    ifsccode: "",
  };
};

export const findUserByEmail = (users, email) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  return (
    users.find((user) => (user.email || "").trim().toLowerCase() === normalizedEmail) ||
    null
  );
};

export const canShowEditProfile = (user) => {
  if (!user) return true;
  if (user.role === ADMIN_ROLE) return true;

  const raw = user.canshoweditprofile ?? user.canShowEditProfile;
  if (raw === undefined || raw === null) return true;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "false" || normalized === "0") return false;
    if (normalized === "true" || normalized === "1") return true;
    return true;
  }
  return Boolean(raw);
};
