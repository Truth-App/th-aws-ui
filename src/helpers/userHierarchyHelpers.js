import { ADMIN_ROLE } from "../constants/roles";

const ROLE_ORDER = {
  [ADMIN_ROLE]: 0,
  "Super Stockist": 1,
  Stockist: 2,
  Dealer: 3,
  Customer: 4,
};

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

export const buildUserHierarchy = (users = []) => {
  const enriched = users.map((user) => ({
    ...user,
    _userId: getUserDisplayId(user),
    _ref: getUserReferenceNumber(user),
  }));

  const childrenByParentId = new Map();
  enriched.forEach((user) => {
    if (!user._ref) return;
    if (!childrenByParentId.has(user._ref)) {
      childrenByParentId.set(user._ref, []);
    }
    childrenByParentId.get(user._ref).push(user);
  });

  const buildNode = (user) => ({
    user,
    children: sortUsersByHierarchy(childrenByParentId.get(user._userId) || []).map(buildNode),
  });

  const visited = new Set();
  const collectVisited = (node) => {
    visited.add(node.user.id);
    node.children.forEach(collectVisited);
  };

  const adminRoots = sortUsersByHierarchy(enriched.filter((user) => user.role === ADMIN_ROLE));

  const roots = adminRoots.map((user) => {
    const node = buildNode(user);
    collectVisited(node);
    return node;
  });

  const unlinked = sortUsersByHierarchy(enriched.filter((user) => !visited.has(user.id)));

  return { roots, unlinked };
};

export const countHierarchyNodes = (nodes) =>
  nodes.reduce((total, node) => total + 1 + countHierarchyNodes(node.children), 0);
