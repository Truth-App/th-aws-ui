import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
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
} from "../helpers/userHierarchyHelpers";
import { MdSearch } from "react-icons/md";

const ROLE_COLORS = {
  Administrator: { bg: "#e8f5e9", color: "#1b5e20" },
  "Super Stockist": { bg: "#e3f2fd", color: "#0d47a1" },
  Stockist: { bg: "#fff3e0", color: "#e65100" },
  Dealer: { bg: "#f3e5f5", color: "#6a1b9a" },
  Customer: { bg: "#eceff1", color: "#37474f" },
};

const ROLE_ABBREVIATIONS = {
  Administrator: "A",
  "Super Stockist": "SS",
  Stockist: "S",
  Dealer: "D",
  Customer: "C",
};

const getRoleAbbreviation = (role) => ROLE_ABBREVIATIONS[role] || role || "—";

const HierarchyNode = ({
  node,
  depth = 0,
  defaultExpanded = true,
  searchTerm = "",
  isMobile = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const userId = getUserDisplayId(node.user);
  const name = getUserDisplayName(node.user);
  const role = node.user.role || "—";
  const referenceNumber = getUserReferenceNumber(node.user);
  const hasChildren = node.children.length > 0;
  const directCount = countDirectChildren(node);

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
  const indentSize = isMobile ? 10 : 20;
  const nodeIndent = depth > 0 ? Math.min(depth, 5) * indentSize : 0;
  const displayName = name || "—";
  const roleCode = getRoleAbbreviation(role);
  const summaryLabel =
    role === "Customer"
      ? `(${roleCode}) - ${displayName}`
      : `(${roleCode}) - ${displayName} - [${directCount}]`;

  return (
    <div style={{ marginLeft: nodeIndent }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5em",
          padding: isMobile ? "0.55em 0.65em" : "0.5em 0.75em",
          marginBottom: "0.35em",
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
              flexShrink: 0,
              padding: 0,
              marginTop: "2px",
            }}
          >
            {showExpanded ? "−" : "+"}
          </button>
        ) : (
          <span style={{ width: "1.25em", flexShrink: 0 }} />
        )}
        <Typography
          variant="body2"
          style={{
            minWidth: 0,
            flex: 1,
            fontWeight: 600,
            color: "#165d46",
            lineHeight: 1.35,
            wordBreak: "break-word",
            fontSize: isMobile ? "0.8rem" : undefined,
          }}
        >
          {summaryLabel}
        </Typography>
      </div>
      {hasChildren && showExpanded && (
        <div
          style={{
            borderLeft: depth === 0 ? "none" : "2px solid #d7e5de",
            marginLeft: isMobile ? "0.35em" : "0.6em",
            paddingLeft: isMobile ? "0.35em" : "0.5em",
          }}
        >
          {node.children.map((child) => (
            <HierarchyNode
              key={child.user.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={depth < 1}
              searchTerm={searchTerm}
              isMobile={isMobile}
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

const RoleLevelSummary = ({ roleCounts, visibleRoles, isMobile = false }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: isMobile ? "0.35em" : "0.5em",
      marginBottom: "1em",
    }}
  >
    {visibleRoles.map((role) => (
      <Chip
        key={role}
        label={`(${getRoleAbbreviation(role)}) ${role} : ${roleCounts[role] || 0}`}
        size="small"
        style={{
          backgroundColor: ROLE_COLORS[role]?.bg || "#f5f5f5",
          color: ROLE_COLORS[role]?.color || "#424242",
          fontWeight: 600,
          fontSize: isMobile ? "0.68rem" : undefined,
          height: isMobile ? "auto" : undefined,
        }}
        sx={
          isMobile
            ? {
                "& .MuiChip-label": {
                  whiteSpace: "normal",
                  lineHeight: 1.2,
                  paddingTop: "4px",
                  paddingBottom: "4px",
                },
              }
            : undefined
        }
      />
    ))}
  </div>
);

const UserHierarchy = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
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
        boxShadow: "none",
        border: "none",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: isMobile ? "12px" : "16px" }}>
        <Typography
          variant="h6"
          style={{
            color: "#1a1a1a",
            fontWeight: 700,
            marginBottom: "0.2em",
            fontSize: isMobile ? "1.05rem" : "1.25rem",
            letterSpacing: "-0.01em",
          }}
        >
          User Management Hierarchy
        </Typography>
        <Typography
          variant="body2"
          style={{
            color: "#6f7378",
            marginBottom: "1em",
            fontSize: isMobile ? "0.8rem" : "0.875rem",
            lineHeight: 1.45,
          }}
        >
          {hierarchyDescription}
        </Typography>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75em",
            marginBottom: "1em",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "1 1 auto",
              minWidth: isMobile ? 0 : "220px",
              width: isMobile ? "100%" : "auto",
              height: isMobile ? "42px" : "46px",
              padding: "0 14px",
              borderRadius: "12px",
              backgroundColor: "#f8f8f8",
              border: "1px solid #e8e8e8",
              boxSizing: "border-box",
            }}
          >
            <MdSearch size={20} color="#868686" style={{ flexShrink: 0 }} />
            <InputBase
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search "hierarchy"'
              fullWidth
              sx={{
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                color: "#1a1a1a",
                "& input::placeholder": {
                  color: "#9a9a9a",
                  opacity: 1,
                },
              }}
            />
          </div>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExpandAll((prev) => !prev)}
            style={{
              color: "#0c831f",
              borderColor: "#0c831f",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              height: isMobile ? "42px" : "46px",
              width: isMobile ? "100%" : "auto",
              padding: "0 14px",
            }}
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
            <RoleLevelSummary
              roleCounts={roleCounts}
              visibleRoles={visibleLevelRoles}
              isMobile={isMobile}
            />

            <Typography
              variant="body2"
              style={{
                color: "#165d46",
                marginBottom: "0.75em",
                fontWeight: 600,
                fontSize: isMobile ? "0.8rem" : undefined,
                lineHeight: 1.4,
              }}
            >
              {linkedCount} user{linkedCount === 1 ? "" : "s"} in hierarchy
              {isAdminViewer && unlinked.length > 0 ? ` · ${unlinked.length} unlinked` : ""}
            </Typography>

            <div
              key={expandAll ? "expanded" : "collapsed"}
              style={{ flex: 1, overflow: "auto", minHeight: 0, WebkitOverflowScrolling: "touch" }}
            >
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
                  isMobile={isMobile}
                />
              ))}

              {isAdminViewer && unlinked.length > 0 && (
                <div style={{ marginTop: "1.5em" }}>
                  <Typography
                    variant="subtitle2"
                    style={{ color: "#165d46", fontWeight: 700, marginBottom: "0.75em", fontSize: isMobile ? "0.85rem" : undefined }}
                  >
                    Unlinked Users ({unlinked.length})
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{ color: "#6f7378", display: "block", marginBottom: "0.75em", lineHeight: 1.4 }}
                  >
                    Users with a reference number that does not connect to any root user tree.
                  </Typography>
                  {unlinked.map((user) => (
                    <HierarchyNode
                      key={user.id}
                      node={{ user, children: [] }}
                      searchTerm={searchTerm}
                      isMobile={isMobile}
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
