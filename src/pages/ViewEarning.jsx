import AdminPageLayout from "../components/AdminPageLayout";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { fetchAuthSession } from "aws-amplify/auth";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { EARNINGS_API_URL } from "../constants/api";
import { ADMIN_ROLE } from "../constants/roles";
import { getUserRoleFromList } from "../constants/dashboardFeatures";

const EARNINGS_ROLE_OPTIONS = ["Administrator", "Super Stockist", "Stockist", "Dealer"];

const formatInr = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return "INR 0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
};

const getEarningsArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.earnings)) return response.earnings;
  if (Array.isArray(response?.data)) return response.data;
  if (response && typeof response === "object" && response.userId) return [response];
  return [];
};

const normalizeRole = (role) => String(role || "").trim();

const formatOrderCreatedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getMonthYearKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const getMonthYearLabel = (key) => {
  const [yearString, monthString] = String(key || "").split("-");
  const year = Number(yearString);
  const month = Number(monthString);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return "Unknown";
  }

  const labelDate = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(labelDate);
};

const groupEarningsHistory = (history) => {
  if (!Array.isArray(history) || history.length === 0) return [];

  const sorted = [...history].sort((a, b) => {
    const first = new Date(a?.orderTimestamp).getTime();
    const second = new Date(b?.orderTimestamp).getTime();
    return second - first;
  });

  const groupedMap = sorted.reduce((acc, entry) => {
    const key = getMonthYearKey(entry?.orderTimestamp) || "unknown";
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key).push(entry);
    return acc;
  }, new Map());

  return Array.from(groupedMap.entries()).map(([key, entries]) => {
    const totalShare = entries.reduce((sum, entry) => {
      const shareValue = Number(entry?.share);
      return sum + (Number.isFinite(shareValue) ? shareValue : 0);
    }, 0);

    return {
      key,
      label: key === "unknown" ? "Unknown" : getMonthYearLabel(key),
      totalShare,
      entries,
    };
  });
};

const fetchEarnings = async () => {
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString() || "";

  const response = await fetch(EARNINGS_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch earnings. Status: ${response.status}`);
  }

  return await response.json();
};

const ViewEarning = () => {
  const authUser = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [expandedRowId, setExpandedRowId] = useState(null);

  const currentUserRole = useMemo(() => getUserRoleFromList(users, authUser?.email), [users, authUser?.email]);
  const isAdminUser = currentUserRole === ADMIN_ROLE;

  useEffect(() => {
    let ignore = false;

    const loadEarnings = async () => {
      setLoading(true);
      setError("");

      try {
        const earningsResponse = await fetchEarnings();
        const nextUsers = getEarningsArray(earningsResponse);

        if (!ignore) {
          setUsers(nextUsers);
        }
      } catch (fetchError) {
        if (!ignore) {
          setUsers([]);
          setError(fetchError?.message || "Failed to fetch earnings summary.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadEarnings();

    return () => {
      ignore = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      users
        .filter((item) => roleFilter === "All" || normalizeRole(item?.role) === roleFilter)
        .map((item, index) => ({
          id: String(item?.userId || item?.id || item?.email || index + 1),
          name:
            `${item?.firstName || item?.firstname || ""} ${item?.lastName || item?.lastname || ""}`.trim() ||
            "-",
          email: item?.email || "-",
          role: normalizeRole(item?.role) || "-",
          mobile: item?.mobile || item?.phone || "-",
          earnings: formatInr(item?.totalEarnings ?? 0),
          earningsHistoryGroups: groupEarningsHistory(item?.earningsHistory),
        })),
    [users, roleFilter],
  );

  return (
    <AdminPageLayout activeFeature="view-earnings">
      <Card
        style={{
          width: "100%",
          height: "100%",
          overflowY: "visible",
          border: "1px solid var(--brand-border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent>
          <Typography variant="h6" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
            View Earnings Summary
          </Typography>

          {isAdminUser && (
            <TextField
              select
              size="small"
              label="Role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
              }}
              style={{ marginTop: "16px", minWidth: 220 }}
            >
              <MenuItem value="All">All Roles</MenuItem>
              {EARNINGS_ROLE_OPTIONS.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          )}

          {loading && (
            <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
              <CircularProgress size={20} style={{ color: "var(--brand-primary)" }} />
              <Typography variant="body2" color="text.secondary">
                Loading earnings...
              </Typography>
            </div>
          )}

          {!!error && (
            <Alert severity="error" style={{ marginTop: "16px" }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <TableContainer
                component={Paper}
                style={{ marginTop: "16px", border: "1px solid var(--brand-border)", boxShadow: "none" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: 56, fontWeight: 700 }}>Expand</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell style={{ fontWeight: 700 }}>Total Earnings (INR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} style={{ textAlign: "center", color: "#6f7378" }}>
                          No users found{roleFilter !== "All" ? ` for role ${roleFilter}` : ""}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => {
                        const hasHistory = row.earningsHistoryGroups.length > 0;
                        const isExpanded = expandedRowId === row.id;

                        return (
                          <Fragment key={row.id}>
                            <TableRow key={row.id}>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  disabled={!hasHistory}
                                  onClick={() => {
                                    if (!hasHistory) return;
                                    setExpandedRowId((current) => (current === row.id ? null : row.id));
                                  }}
                                  aria-label={isExpanded ? "Collapse earnings history" : "Expand earnings history"}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    backgroundColor: hasHistory ? "var(--brand-primary)" : "#e2e8f4",
                                    color: hasHistory ? "#ffffff" : "#8fa0ba",
                                    "&:hover": {
                                      backgroundColor: hasHistory ? "var(--brand-primary-strong)" : "#e2e8f4",
                                    },
                                    "&.Mui-disabled": {
                                      backgroundColor: "#e2e8f4",
                                      color: "#8fa0ba",
                                      opacity: 1,
                                    },
                                  }}
                                >
                                  {isExpanded ? <FiChevronDown size={16} color="currentColor" /> : <FiChevronRight size={16} color="currentColor" />}
                                </IconButton>
                              </TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.email}</TableCell>
                              <TableCell>{row.role}</TableCell>
                              <TableCell>{row.mobile}</TableCell>
                              <TableCell style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
                                {row.earnings}
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell
                                colSpan={6}
                                style={{ paddingBottom: 0, paddingTop: 0, borderBottom: isExpanded ? "none" : undefined }}
                              >
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <div
                                    style={{
                                      margin: "8px 0 12px 0",
                                      padding: "10px 12px",
                                      backgroundColor: "#f7fbff",
                                      border: "1px solid #e3f0ff",
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: "8px" }}>
                                      Earnings History
                                    </Typography>
                                    <TableContainer
                                      component={Paper}
                                      style={{ border: "1px solid var(--brand-border)", boxShadow: "none" }}
                                    >
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell style={{ fontWeight: 700 }}>Order ID</TableCell>
                                            <TableCell style={{ fontWeight: 700 }}>Share</TableCell>
                                            <TableCell style={{ fontWeight: 700 }}>Order Created At</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {row.earningsHistoryGroups.map((group) => (
                                            <Fragment key={`${row.id}-${group.key}`}>
                                              <TableRow>
                                                <TableCell
                                                  colSpan={3}
                                                  style={{
                                                    fontWeight: 700,
                                                    color: "var(--brand-primary)",
                                                    backgroundColor: "rgba(25, 118, 210, 0.06)",
                                                  }}
                                                >
                                                  {group.label} - Total Earnings: {group.totalShare}
                                                </TableCell>
                                              </TableRow>

                                              {group.entries.map((entry, index) => (
                                                <TableRow key={`${row.id}-${group.key}-${entry?.orderId || index}`}>
                                                  <TableCell>{entry?.orderId || "-"}</TableCell>
                                                  <TableCell>{entry?.share ?? "-"}</TableCell>
                                                  <TableCell>{formatOrderCreatedAt(entry?.orderTimestamp)}</TableCell>
                                                </TableRow>
                                              ))}
                                            </Fragment>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </div>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default ViewEarning;
