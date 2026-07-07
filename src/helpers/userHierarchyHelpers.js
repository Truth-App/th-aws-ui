import { ADMIN_ROLE } from "../constants/roles";

const ROLE_ORDER = {
  [ADMIN_ROLE]: 0,
  "Super Stockist": 1,
  Stockist: 2,
  Dealer: 3,
  Customer: 4,
};

export const HIERARCHY_LEVEL_ROLES = [
  ADMIN_ROLE,
  "Super Stockist",
  "Stockist",
  "Dealer",
  "Customer",
];

export const HIERARCHY_LEVEL_LABELS = {
  [ADMIN_ROLE]: "Administrators",
  "Super Stockist": "Super Stockists",
  Stockist: "Stockists",
  Dealer: "Dealers",
  Customer: "Customers",
};

export const HIERARCHY_VIEWER_ROLES = ["Super Stockist", "Stockist", "Dealer"];

export const getUserDisplayId = (user) => (user?.userId || user?.userid || "").trim();

export const getUserReferenceNumber = (user) =>
  (user?.referencenumber || user?.referenceNumber || "").trim();

export const getUserDisplayName = (user) => {
  const first = user?.firstname || user?.firstName || "";
  const last = user?.lastname || user?.lastName || "";
  const fullName = `${first} ${last}`.trim();
  return fullName || user?.email || "—";
};

export const sortUsersByHierarchy = (list) =>
  [...list].sort((a, b) => {
    const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return getUserDisplayId(a).localeCompare(getUserDisplayId(b));
  });

const enrichUsers = (users = []) =>
  users.map((user) => ({
    ...user,
    _userId: getUserDisplayId(user),
    _ref: getUserReferenceNumber(user),
  }));

const buildChildrenMap = (enriched) => {
  const childrenByParentId = new Map();
  enriched.forEach((user) => {
    if (!user._ref) return;
    if (!childrenByParentId.has(user._ref)) {
      childrenByParentId.set(user._ref, []);
    }
    childrenByParentId.get(user._ref).push(user);
  });
  return childrenByParentId;
};

const buildNode = (user, childrenByParentId) => ({
  user,
  children: sortUsersByHierarchy(childrenByParentId.get(user._userId) || []).map((child) =>
    buildNode(child, childrenByParentId),
  ),
});

export const countHierarchyNodes = (nodes) =>
  nodes.reduce((total, node) => total + 1 + countHierarchyNodes(node.children), 0);

export const countDirectChildren = (node) => node.children.length;

export const countAllDescendants = (node) =>
  node.children.reduce((sum, child) => sum + 1 + countAllDescendants(child), 0);

export const countRolesInHierarchy = (nodes) => {
  const counts = {
    [ADMIN_ROLE]: 0,
    "Super Stockist": 0,
    Stockist: 0,
    Dealer: 0,
    Customer: 0,
  };

  const walk = (nodeList) => {
    nodeList.forEach((node) => {
      const role = node.user.role;
      if (Object.prototype.hasOwnProperty.call(counts, role)) {
        counts[role] += 1;
      }
      walk(node.children);
    });
  };

  walk(nodes);
  return counts;
};

export const findViewerUser = (users, email) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  return (
    users.find((user) => (user.email || "").trim().toLowerCase() === normalizedEmail) || null
  );
};

export const buildUserHierarchy = (users = [], viewerUser = null) => {
  const enriched = enrichUsers(users);
  const childrenByParentId = buildChildrenMap(enriched);
  const viewerRole = viewerUser?.role || "";

  if (viewerRole === "Customer") {
    return {
      roots: [],
      unlinked: [],
      roleCounts: countRolesInHierarchy([]),
      isCustomerViewer: true,
      isScopedView: false,
    };
  }

  const viewerRecord = viewerUser
    ? enriched.find(
        (user) =>
          user.id === viewerUser.id ||
          (viewerUser.email &&
            (user.email || "").trim().toLowerCase() === viewerUser.email.trim().toLowerCase()),
      )
    : null;

  if (viewerRole === ADMIN_ROLE) {
    const visited = new Set();
    const collectVisited = (node) => {
      visited.add(node.user.id);
      node.children.forEach(collectVisited);
    };

    const adminRoots = sortUsersByHierarchy(enriched.filter((user) => user.role === ADMIN_ROLE));
    const roots = adminRoots.map((user) => {
      const node = buildNode(user, childrenByParentId);
      collectVisited(node);
      return node;
    });

    const unlinked = sortUsersByHierarchy(enriched.filter((user) => !visited.has(user.id)));

    return {
      roots,
      unlinked,
      roleCounts: countRolesInHierarchy(roots),
      isCustomerViewer: false,
      isScopedView: false,
    };
  }

  if (viewerRecord && HIERARCHY_VIEWER_ROLES.includes(viewerRole)) {
    const rootNode = buildNode(viewerRecord, childrenByParentId);

    return {
      roots: [rootNode],
      unlinked: [],
      roleCounts: countRolesInHierarchy([rootNode]),
      isCustomerViewer: false,
      isScopedView: true,
    };
  }

  return {
    roots: [],
    unlinked: [],
    roleCounts: countRolesInHierarchy([]),
    isCustomerViewer: false,
    isScopedView: false,
  };
};

export const getVisibleLevelRoles = (viewerRole, isScopedView) => {
  if (viewerRole === ADMIN_ROLE) {
    return HIERARCHY_LEVEL_ROLES;
  }

  if (viewerRole === "Super Stockist") {
    return ["Super Stockist", "Stockist", "Dealer", "Customer"];
  }

  if (viewerRole === "Stockist") {
    return ["Stockist", "Dealer", "Customer"];
  }

  if (viewerRole === "Dealer") {
    return ["Dealer", "Customer"];
  }

  return isScopedView ? HIERARCHY_LEVEL_ROLES.filter((role) => role !== ADMIN_ROLE) : [];
};
