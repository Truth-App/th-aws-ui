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
  countHierarchyNodes,
  getUserDisplayId,
  getUserDisplayName,
  getUserReferenceNumber,
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
  const hasChildren = node.children.length > 0;
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
          label={role}
          size="small"
          style={{
            backgroundColor: roleStyle.bg,
            color: roleStyle.color,
            fontWeight: 600,
          }}
        />
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

const UserHierarchy = () => {
  const dispatch = useDispatch();
  const { items: users, status, error } = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandAll, setExpandAll] = useState(true);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, status]);

  const { roots, unlinked } = useMemo(() => buildUserHierarchy(users), [users]);
  const linkedCount = useMemo(() => countHierarchyNodes(roots), [roots]);

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
          Tree built from User ID and Reference Number. Each user&apos;s reference number points to
          their parent&apos;s User ID.
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
            <Typography variant="body2" style={{ color: "#165d46", marginBottom: "0.75em", fontWeight: 600 }}>
              {linkedCount} linked user{linkedCount === 1 ? "" : "s"}
              {unlinked.length > 0 ? ` · ${unlinked.length} unlinked` : ""}
            </Typography>

              <div key={expandAll ? "expanded" : "collapsed"} style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              {roots.length === 0 && (
                <Typography style={{ color: "#6f7378", textAlign: "center", marginTop: "2em" }}>
                  No administrator users found to build hierarchy.
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

              {unlinked.length > 0 && (
                <div style={{ marginTop: "1.5em" }}>
                  <Typography
                    variant="subtitle2"
                    style={{ color: "#165d46", fontWeight: 700, marginBottom: "0.75em" }}
                  >
                    Unlinked Users
                  </Typography>
                  <Typography variant="caption" style={{ color: "#6f7378", display: "block", marginBottom: "0.75em" }}>
                    Users not connected to an administrator tree (missing or invalid reference number).
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
