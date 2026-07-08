import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../store/slices/usersSlice";
import {
  buildUserHierarchy,
  countDirectChildren,
  countHierarchyNodes,
  findViewerUser,
  getUserDisplayId,
  getUserDisplayName,
  getUserReferenceNumber,
  getVisibleLevelRoles,
  HIERARCHY_LEVEL_LABELS,
  isAdminRootUser,
} from "../helpers/userHierarchyHelpers";

const ROLE_COLORS = {
  Administrator: { bg: "#e8f5e9", color: "#1b5e20" },
  "Super Stockist": { bg: "#e3f2fd", color: "#0d47a1" },
  Stockist: { bg: "#fff3e0", color: "#e65100" },
  Dealer: { bg: "#f3e5f5", color: "#6a1b9a" },
  Customer: { bg: "#eceff1", color: "#37474f" },
};

const HierarchyNode = ({ node, depth = 0, defaultExpanded = true, searchTerm = "" }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const userId = getUserDisplayId(node.user);
  const name = getUserDisplayName(node.user);
  const role = node.user.role || "—";
  const referenceNumber = getUserReferenceNumber(node.user);
  const isRootAdmin = isAdminRootUser(node.user);
  const hasChildren = node.children.length > 0;
  const directCount = countDirectChildren(node);
  const roleStyle = ROLE_COLORS[role] || { bg: "#f5f5f5", color: "#424242" };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch =
    !normalizedSearch ||
    [userId, name, role, referenceNumber, node.user.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));

  const childMatches = node.children.some((child) =>
    nodeMatchesSearch(child, normalizedSearch),
  );

  if (normalizedSearch && !matchesSearch && !childMatches) {
    return null;
  }

  const showExpanded = normalizedSearch ? true : expanded;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : "1.25em" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          padding: "0.5em 0.75em",
          marginBottom: "0.25em",
          borderRadius: "6px",
          border: "1px solid #e8efeb",
          backgroundColor: depth === 0 ? "#fafbf9" : "#fff",
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={showExpanded ? "Collapse" : "Expand"}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#165d46",
              fontWeight: 700,
              width: "1.25em",
              padding: 0,
            }}
          >
            {showExpanded ? "−" : "+"}
          </button>
        ) : (
          <span style={{ width: "1.25em" }} />
        )}
        <Typography variant="body2" style={{ fontWeight: 700, color: "#165d46", minWidth: "72px" }}>
          {userId || "—"}
        </Typography>
        <Typography variant="body2" style={{ flex: 1, minWidth: 0 }}>
          {name}
        </Typography>
        <Chip
          label={isRootAdmin ? `${role} · Root` : role}
          size="small"
          style={{
            backgroundColor: roleStyle.bg,
            color: roleStyle.color,
            fontWeight: 600,
          }}
        />
        {hasChildren && (
          <Typography variant="caption" style={{ color: "#165d46", fontWeight: 600, minWidth: "72px" }}>
            {directCount} User{directCount === 1 ? "" : "s"}
          </Typography>
        )}
        <Typography variant="caption" style={{ color: "#6f7378", minWidth: "120px" }}>
          Ref: {referenceNumber || "—"}
        </Typography>
      </div>
      {hasChildren && showExpanded && (
        <div
          style={{
            borderLeft: depth === 0 ? "none" : "2px solid #d7e5de",
            marginLeft: "0.6em",
            paddingLeft: "0.5em",
          }}
        >
          {node.children.map((child) => (
            <HierarchyNode
              key={child.user.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={depth < 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const nodeMatchesSearch = (node, normalizedSearch) => {
  if (!normalizedSearch) return true;

  const userId = getUserDisplayId(node.user);
  const name = getUserDisplayName(node.user);
  const referenceNumber = getUserReferenceNumber(node.user);

  const matches = [userId, name, node.user.role, referenceNumber, node.user.email]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));

  return matches || node.children.some((child) => nodeMatchesSearch(child, normalizedSearch));
};

const RoleLevelSummary = ({ roleCounts, visibleRoles }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5em",
      marginBottom: "1em",
    }}
  >
    {visibleRoles.map((role) => (
      <Chip
        key={role}
        label={`${HIERARCHY_LEVEL_LABELS[role]}: ${roleCounts[role] || 0}`}
        size="small"
        style={{
          backgroundColor: ROLE_COLORS[role]?.bg || "#f5f5f5",
          color: ROLE_COLORS[role]?.color || "#424242",
          fontWeight: 600,
        }}
      />
    ))}
  </div>
);

const UserHierarchy = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.user.user);
  const { items: users, status, error } = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, status]);

  const viewerUser = useMemo(
    () => findViewerUser(users, authUser?.email),
    [users, authUser?.email],
  );
  const { roots, unlinked, roleCounts, isAdminViewer, isScopedView } = useMemo(
    () => buildUserHierarchy(users, viewerUser),
    [users, viewerUser],
  );

  const linkedCount = useMemo(() => countHierarchyNodes(roots), [roots]);
  const visibleLevelRoles = useMemo(
    () => getVisibleLevelRoles(roleCounts),
    [roleCounts],
  );

  const hierarchyDescription = useMemo(() => {
    if (isAdminViewer) {
      return "Full hierarchy from users without a reference number (treated as admin roots). Each user's reference number points to their parent's User ID.";
    }
    if (isScopedView) {
      return "Showing your downline only. Your account has a reference number, so the tree starts from you and includes users linked below you.";
    }
    return "Tree built from User ID and Reference Number.";
  }, [isAdminViewer, isScopedView]);

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Typography variant="h6" style={{ color: "#165d46", fontWeight: 700, marginBottom: "0.25em" }}>
          User Management Hierarchy
        </Typography>
        <Typography variant="body2" style={{ color: "#6f7378", marginBottom: "1em" }}>
          {hierarchyDescription}
        </Typography>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75em",
            marginBottom: "1em",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            label="Search hierarchy"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: "1 1 220px", minWidth: "220px" }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExpandAll((prev) => !prev)}
            style={{ color: "#165d46", borderColor: "#165d46", textTransform: "none" }}
          >
            {expandAll ? "Collapse all" : "Expand all"}
          </Button>
        </div>

        {status === "loading" && <Typography>Loading users...</Typography>}
        {status === "failed" && (
          <Typography color="error">{error || "Unable to load users."}</Typography>
        )}

        {status === "succeeded" && (
          <>
            <RoleLevelSummary roleCounts={roleCounts} visibleRoles={visibleLevelRoles} />

            <Typography variant="body2" style={{ color: "#165d46", marginBottom: "0.75em", fontWeight: 600 }}>
              {linkedCount} user{linkedCount === 1 ? "" : "s"} in hierarchy
              {isAdminViewer && unlinked.length > 0 ? ` · ${unlinked.length} unlinked` : ""}
            </Typography>

            <div key={expandAll ? "expanded" : "collapsed"} style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {roots.length === 0 && (
                <Typography style={{ color: "#6f7378", textAlign: "center", marginTop: "2em" }}>
                  {isScopedView
                    ? "No downline users found for your account."
                    : "No root users found. Users without a reference number become hierarchy roots."}
                </Typography>
              )}

              {roots.map((root) => (
                <HierarchyNode
                  key={root.user.id}
                  node={root}
                  defaultExpanded={expandAll}
                  searchTerm={searchTerm}
                />
              ))}

              {isAdminViewer && unlinked.length > 0 && (
                <div style={{ marginTop: "1.5em" }}>
                  <Typography
                    variant="subtitle2"
                    style={{ color: "#165d46", fontWeight: 700, marginBottom: "0.75em" }}
                  >
                    Unlinked Users ({unlinked.length})
                  </Typography>
                  <Typography variant="caption" style={{ color: "#6f7378", display: "block", marginBottom: "0.75em" }}>
                    Users with a reference number that does not connect to any root user tree.
                  </Typography>
                  {unlinked.map((user) => (
                    <HierarchyNode
                      key={user.id}
                      node={{ user, children: [] }}
                      searchTerm={searchTerm}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserHierarchy;
