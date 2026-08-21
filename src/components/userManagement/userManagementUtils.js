import { S3_BASE_URL } from "../../constants/api";
import { ADMIN_ROLE } from "../../constants/roles";
import { parseUserPrivileges } from "../../constants/dashboardFeatures";
import { User } from "../../models/User";

const INITIAL_USER_FORM = User.createEmpty().toFormValues();

const normalizeUserStatus = (value) =>
  String(value || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active";

const getUserId = (user) => user.userId || user.email || user.id || "—";

const getUserApiId = (user) => user?.id || "";

const mapReferenceNumberFromUserId = (selectedUser) =>
  selectedUser?.userId || selectedUser?.referencenumber || selectedUser?.referenceNumber || "";

const getAssignedRoleFromReferenceUser = (selectedUser) => {
  if (!selectedUser) return "Customer";

  switch (selectedUser?.role) {
    case ADMIN_ROLE:
      return "Super Stockist";
    case "Super Stockist":
      return "Stockist";
    case "Stockist":
      return "Dealer";
    case "Dealer":
    case "Customer":
      return "Customer";
    default:
      return "Customer";
  }
};

const getDefaultDiscountRateByRole = (role) => {
  switch (role) {
    case "Super Stockist":
      return 5;
    case "Stockist":
      return 2;
    case "Dealer":
      return 10;
    default:
      return 0;
  }
};

const getUserDiscountRate = (selectedUser) => {
  const raw = selectedUser?.discountrate ?? selectedUser?.discountRate ?? null;
  if (raw === null || raw === undefined || raw === "") {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BANK_DETAILS_ROLES = new Set(["Super Stockist", "Stockist", "Dealer"]);
const SUPPORTED_PINCODE_ROLE = "Super Stockist";

const shouldShowBankDetails = (role) => BANK_DETAILS_ROLES.has(role);
const shouldShowSupportedPincodes = (currentUserRole, targetUserRole) =>
  currentUserRole === ADMIN_ROLE && targetUserRole === SUPPORTED_PINCODE_ROLE;

const CLEARED_BANK_DETAILS = {
  bankname: null,
  accountno: null,
  ifsccode: null,
};

const IST_TIME_ZONE = "Asia/Kolkata";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getISTDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

const getNowDateString = () => {
  const { year, month, day, hour, minute, second } = getISTDateParts();
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
};

const formatActivityDateDisplay = (dateStr) => {
  if (!dateStr) return "—";

  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime()) && String(dateStr).includes("T")) {
    const { year, month, day, hour, minute, second } = getISTDateParts(parsed);
    const monthIndex = Number(month) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) {
      return `${Number(day)} ${MONTH_LABELS[monthIndex]} ${year}, ${hour}:${minute}:${second} IST`;
    }
  }

  const normalized = String(dateStr).slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (year && month && day) {
    const monthIndex = Number(month) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) {
      return `${Number(day)} ${MONTH_LABELS[monthIndex]} ${year}`;
    }
  }

  return String(dateStr);
};

const normalizeActivityLogEntry = (entry) => {
  if (!entry || typeof entry !== "object") {
    return {
      role: "",
      referencenumber: "",
      modifiedBy: "",
      modifiedAt: "",
      field: "",
      oldValue: "",
      newValue: "",
    };
  }

  return {
    role: entry.role || "",
    referencenumber: entry.referencenumber || entry.referenceNumber || "",
    modifiedBy: entry.modifiedBy ?? entry.modifiedby ?? "",
    modifiedAt: entry.modifiedAt ?? entry.modifiedat ?? "",
    field: entry.field || "",
    oldValue: entry.oldValue ?? entry.oldvalue ?? "",
    newValue: entry.newValue ?? entry.newvalue ?? "",
  };
};

const getActivityLog = (item) => {
  const raw = item?.activitylog ?? item?.activityLog ?? null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeActivityLogEntry);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeActivityLogEntry);
    } catch {
      return [];
    }
  }
  return [];
};

const toUpdateActivityRows = (history = []) => {
  const groups = new Map();

  history.forEach((entry, index) => {
    const isLegacyFieldEntry = Boolean(entry.field);
    const key = entry.modifiedAt || `row-${index}`;
    const existing = groups.get(key) || {
      role: "—",
      referencenumber: "—",
      modifiedBy: entry.modifiedBy || "—",
      modifiedAt: entry.modifiedAt || "",
    };

    if (isLegacyFieldEntry) {
      if (entry.field === "role") {
        existing.role = entry.oldValue || "—";
      }
      if (entry.field === "referencenumber") {
        existing.referencenumber = entry.oldValue || "—";
      }
    } else {
      if (entry.role) existing.role = entry.role;
      if (entry.referencenumber) existing.referencenumber = entry.referencenumber;
    }

    existing.modifiedBy = entry.modifiedBy || existing.modifiedBy || "—";
    existing.modifiedAt = entry.modifiedAt || existing.modifiedAt || "";
    groups.set(key, existing);
  });

  return [...groups.values()].sort((a, b) => {
    const timeA = new Date(a.modifiedAt).getTime();
    const timeB = new Date(b.modifiedAt).getTime();
    const safeA = Number.isFinite(timeA) ? timeA : 0;
    const safeB = Number.isFinite(timeB) ? timeB : 0;
    return safeB - safeA;
  });
};

const buildActivityLogPayload = ({
  existingHistory = [],
  previousRole = "",
  previousReferenceNumber = "",
  nextRole = "",
  nextReferenceNumber = "",
  modifiedBy = "",
}) => {
  const prevRef = (previousReferenceNumber || "").trim();
  const nextRef = (nextReferenceNumber || "").trim();
  const roleChanged = (previousRole || "") !== (nextRole || "");
  const referenceChanged = prevRef !== nextRef;

  if (!roleChanged && !referenceChanged) {
    return [...existingHistory];
  }

  return [
    ...existingHistory,
    {
      role: previousRole || "—",
      referencenumber: prevRef || "—",
      modifiedBy: modifiedBy || "Unknown",
      modifiedAt: getNowDateString(),
    },
  ];
};

const findUserByReferenceNumber = (users, referenceNumber) => {
  const normalized = (referenceNumber || "").trim();
  if (!normalized) return null;

  return (
    users.find(
      (item) =>
        mapReferenceNumberFromUserId(item) === normalized || item.userId === normalized,
    ) || null
  );
};

const getUserImageKeys = (selectedUser) => {
  const raw =
    selectedUser?.imageKeys ??
    selectedUser?.imagekeys ;

  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON
    }
    return raw ? [raw] : [];
  }
  return [];
};

const getUserPrivileges = (selectedUser) => parseUserPrivileges(selectedUser);

const getUserActivityLog = (selectedUser) => {
  const raw =
    selectedUser?.activitylog;
    

  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getUserSupportedPincodes = (selectedUser) => {
  const raw =
    selectedUser?.supportedpincodes ??
    selectedUser?.supportedPincodes ??
    selectedUser?.supported_pincodes;

  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // not JSON
    }
    return raw
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const formatSupportedPincodesForDisplay = (userOrPincodes) => {
  const pincodes = Array.isArray(userOrPincodes)
    ? userOrPincodes
    : getUserSupportedPincodes(userOrPincodes);
  return pincodes.length ? pincodes.join(", ") : "—";
};

const mapUserToForm = (selectedUser) => {
  if (!selectedUser || typeof selectedUser !== "object") {
    throw new Error("User model requires an object");
  }
  return User.fromApi(selectedUser).toFormValues();
};

const mapProfileUserToForm = (selectedUser) => ({
  ...mapUserToForm(selectedUser),
  userid: selectedUser.userId || "",
});

const getImageUrl = (imageKey) => `${S3_BASE_URL}/${imageKey}`;

export {
  INITIAL_USER_FORM,
  normalizeUserStatus,
  getUserId,
  getUserApiId,
  mapReferenceNumberFromUserId,
  getAssignedRoleFromReferenceUser,
  getDefaultDiscountRateByRole,
  getUserDiscountRate,
  shouldShowBankDetails,
  shouldShowSupportedPincodes,
  CLEARED_BANK_DETAILS,
  getNowDateString,
  formatActivityDateDisplay,
  normalizeActivityLogEntry,
  getActivityLog,
  toUpdateActivityRows,
  buildActivityLogPayload,
  findUserByReferenceNumber,
  getUserImageKeys,
  getUserPrivileges,
  getUserActivityLog,
  getUserSupportedPincodes,
  formatSupportedPincodesForDisplay,
  mapUserToForm,
  mapProfileUserToForm,
  getImageUrl,
};
