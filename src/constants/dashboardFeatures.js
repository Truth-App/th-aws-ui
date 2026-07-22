import { ADMIN_ROLE } from "./roles";

export const DASHBOARD_FEATURES = [
  { id: "products", label: "Manage Product Catalog", path: "/products", adminOnly: true },
  { id: "categories", label: "Category Management", path: "/categories", adminOnly: true },
  { id: "users", label: "User Management", path: "/users", adminOnly: true },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy", adminOnly: true },
  { id: "inventory", label: "Inventory Management", path: "/inventory", adminOnly: true },
  { id: "orders", label: "My Orders", path: "/my-orders", adminOnly: false },
  { id: "view-orders", label: "View Orders", path: "/view-orders", adminOnly: true },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning", adminOnly: false },
  { id: "reports", label: "Reports", path: "/reports", adminOnly: true },
];

export const FEATURE_LABELS = [
  { id: "products", label: "Manage Product Catalog", path: "/products" },
  { id: "categories", label: "Category Management", path: "/categories" },
  { id: "users", label: "User Management", path: "/users" },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy" },
  { id: "inventory", label: "Inventory Management", path: "/inventory" },
  { id: "orders", label: "My Orders", path: "/my-orders" },
  { id: "view-orders", label: "View Orders", path: "/view-orders" },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning" },
  { id: "reports", label: "Reports", path: "/reports" },
  { id: "my-stocks", label: "My Stocks", path: "/my-stocks" }
];

// get Custom Dashboard Features
export const getCustomDashboardFeatures = () => [
  { id: "orders", label: "My Orders", path: "/my-orders" },
];

// get Dealer Dashboard Features
export const getDealerDashboardFeatures = () => [
  { id: "orders", label: "My Orders", path: "/my-orders" },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy" },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning" },
  { id: "view-orders", label: "View Orders", path: "/view-orders" },
];

//get Stockist Dashboard Features
export const getStockistDashboardFeatures = () => [
  { id: "orders", label: "My Orders", path: "/my-orders" },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy" },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning" },
  { id: "view-orders", label: "View Orders", path: "/view-orders" },
];

//get Super Stockist Dashboard Features
export const getSuperStockistDashboardFeatures = () => [
  { id: "orders", label: "My Orders", path: "/my-orders" },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy" },
  { id: "view-orders", label: "View Orders", path: "/view-orders" },
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning" },
  { id: "order-fulfillment", label: "Order Fulfillment", path: "/order-fulfillment" },
  { id: "reports", label: "Reports", path: "/reports" },
  { id: "my-stocks", label: "My Stocks", path: "/my-stocks" },
];

// get Admin Dashboard Features
export const getAdminDashboardFeatures = () => [
  { id: "products", label: "Manage Product Catalog", path: "/products" },
  { id: "categories", label: "Category Management", path: "/categories" },
  { id: "users", label: "User Management", path: "/users" },
  { id: "user-hierarchy", label: "User Hierarchy", path: "/user-hierarchy" },
  { id: "inventory", label: "Inventory Management", path: "/inventory" }, 
  { id: "view-orders", label: "View Orders", path: "/view-orders" },  
  { id: "view-earnings", label: "View Earnings Summary", path: "/view-earning" } 
];

export const getDashboardFeaturesByRole = (role) => {
  switch (role) {
    case ADMIN_ROLE:
      return getAdminDashboardFeatures();
    case "Customer":
      return getCustomDashboardFeatures();
    case "Dealer":
      return getDealerDashboardFeatures();
    case "Stockist":
      return getStockistDashboardFeatures();
    case "Super Stockist":
      return getSuperStockistDashboardFeatures();
    default:
      return [];
  }
};

export const getDefaultPrivilegeIdsByRole = (role) =>
  getDashboardFeaturesByRole(role).map((feature) => feature.id);

export const getFeatureLabelById = (featureId) =>
  FEATURE_LABELS.find((feature) => feature.id === featureId)?.label || featureId;

export const getUserRoleFromList = (users, email) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return "";

  const matchedUser = users.find(
    (user) => (user.email || "").trim().toLowerCase() === normalizedEmail,
  );

  return matchedUser?.role || "";
};

export const parseUserPrivileges = (user) => {
  if (!user) return [];

  const raw = user.privileges ?? user.privilages ?? user.privilege ?? null;
  let parsedPrivileges = [];

  if (Array.isArray(raw)) {
    parsedPrivileges = raw.filter(Boolean);
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsedPrivileges = parsed.filter(Boolean);
      }
    } catch {
      parsedPrivileges = raw ? [raw] : [];
    }
  }

  return parsedPrivileges;
};

export const getUserPrivilegesFromList = (users, email) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];

  const matchedUser = users.find(
    (user) => (user.email || "").trim().toLowerCase() === normalizedEmail,
  );

  return parseUserPrivileges(matchedUser);
};

export const getVisibleDashboardFeaturesByPrivileges = (privilegeIds = []) => {
  if (!privilegeIds.length) return [];

  const privilegeSet = new Set(privilegeIds);
  return FEATURE_LABELS.filter((feature) => privilegeSet.has(feature.id));
};

export const getVisibleDashboardFeatures = (privilegeIds = []) =>
  getVisibleDashboardFeaturesByPrivileges(privilegeIds);

export const getDashboardHomePathFromPrivileges = (privilegeIds = []) => {
  const features = getVisibleDashboardFeaturesByPrivileges(privilegeIds);
  return features[0]?.path || "/";
};

export const getDashboardHomeLabelFromPrivileges = () => "Dashboard";

export const getDashboardHomePath = (userRole, privilegeIds = []) => {
  const pathFromPrivileges = getDashboardHomePathFromPrivileges(privilegeIds);
  if (pathFromPrivileges !== "/") return pathFromPrivileges;
  return userRole === ADMIN_ROLE ? "/products" : "/my-orders";
};

export const hasDashboardAccess = (privilegeIds = []) => privilegeIds.length > 0;

export const getDashboardHomeLabel = (userRole, privilegeIds = []) => {
  if (hasDashboardAccess(privilegeIds)) return "Dashboard";
  return userRole === ADMIN_ROLE ? "Dashboard" : "My Orders";
};
