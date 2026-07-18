import { useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { getUsers } from "../api/users";
import { USER_ROLES } from "../constants/roles";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ROLE_COLORS = {
  Administrator: "#2e7d32",
  "Super Stockist": "#1976d2",
  Stockist: "#ef6c00",
  Dealer: "#7b1fa2",
  Customer: "#546e7a",
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return {
    fromDate: toInputDate(start),
    toDate: toInputDate(end),
  };
};

const getUserCreatedDate = (user) => {
  const raw =  user?.createdOn || "";

  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const endOfDay = (value) => {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getUserDisplayName = (user) =>
  `${user?.firstname || user?.firstName || ""} ${user?.lastname || user?.lastName || ""}`.trim() ||
  user?.email ||
  "—";

const OnboardingUsersReport = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [roleFilter, setRoleFilter] = useState("All");
  const [appliedFromDate, setAppliedFromDate] = useState(defaults.fromDate);
  const [appliedToDate, setAppliedToDate] = useState(defaults.toDate);
  const [appliedRoleFilter, setAppliedRoleFilter] = useState("All");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedChartRole, setSelectedChartRole] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getUsers();
        if (cancelled) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setUsers([]);
        setError(err?.message || "Failed to load users for onboarding report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const from = startOfDay(appliedFromDate);
    const to = endOfDay(appliedToDate);
    if (!from || !to) return [];

    return users
      .map((user) => {
        const createdDate = getUserCreatedDate(user);
        return createdDate ? { user, createdDate } : null;
      })
      .filter(Boolean)
      .filter(({ createdDate }) => createdDate >= from && createdDate <= to)
      .filter(({ user }) => {
        if (appliedRoleFilter === "All") return true;
        return (user?.role || "Customer") === appliedRoleFilter;
      })
      .sort((a, b) => b.createdDate - a.createdDate);
  }, [users, appliedFromDate, appliedToDate, appliedRoleFilter]);

  const dailyTrend = useMemo(() => {
    const from = startOfDay(appliedFromDate);
    const to = endOfDay(appliedToDate);
    if (!from || !to) return { labels: [], counts: [], dateKeys: [] };

    const dateKeys = [];
    const countsByDay = {};
    const cursor = new Date(from);

    while (cursor <= to) {
      const key = toInputDate(cursor);
      dateKeys.push(key);
      countsByDay[key] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    filteredUsers.forEach(({ createdDate }) => {
      const key = toInputDate(createdDate);
      if (key in countsByDay) countsByDay[key] += 1;
    });

    return {
      dateKeys,
      labels: dateKeys.map((key) =>
        new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
      ),
      counts: dateKeys.map((key) => countsByDay[key]),
    };
  }, [filteredUsers, appliedFromDate, appliedToDate]);

  const tableUsers = useMemo(() => {
    return filteredUsers.filter(({ user, createdDate }) => {
      const matchesDay = !selectedDayKey || toInputDate(createdDate) === selectedDayKey;
      const matchesRole =
        !selectedChartRole || (user?.role || "Customer") === selectedChartRole;
      return matchesDay && matchesRole;
    });
  }, [filteredUsers, selectedDayKey, selectedChartRole]);

  const totalPages = Math.max(1, Math.ceil(tableUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTableUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tableUsers.slice(start, start + PAGE_SIZE);
  }, [tableUsers, currentPage]);

  const roleBreakdown = useMemo(() => {
    const sourceUsers = selectedDayKey
      ? filteredUsers.filter(({ createdDate }) => toInputDate(createdDate) === selectedDayKey)
      : filteredUsers;
    const counts = Object.fromEntries(USER_ROLES.map((role) => [role, 0]));
    sourceUsers.forEach(({ user }) => {
      const role = user?.role || "Customer";
      counts[role] = (counts[role] || 0) + 1;
    });

    const roles = Object.keys(counts).filter((role) => counts[role] > 0);
    return {
      labels: roles,
      counts: roles.map((role) => counts[role]),
      colors: roles.map((role) => ROLE_COLORS[role] || "#90a4ae"),
    };
  }, [filteredUsers, selectedDayKey]);

  const barData = {
    labels: dailyTrend.labels,
    datasets: [
      {
        label: "Users onboarded",
        data: dailyTrend.counts,
        backgroundColor: dailyTrend.dateKeys.map((key) =>
          key === selectedDayKey ? "#0c831f" : "#165d46",
        ),
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const doughnutData = {
    labels: roleBreakdown.labels,
    datasets: [
      {
        data: roleBreakdown.counts,
        backgroundColor: roleBreakdown.labels.map((role) => {
          const base = ROLE_COLORS[role] || "#90a4ae";
          if (!selectedChartRole) return base;
          return role === selectedChartRole ? base : `${base}66`;
        }),
        borderWidth: roleBreakdown.labels.map((role) =>
          selectedChartRole && role === selectedChartRole ? 3 : 1,
        ),
        borderColor: "#ffffff",
      },
    ],
  };

  const handleApply = () => {
    if (!fromDate || !toDate) {
      setError("Please select both from and to dates.");
      return;
    }
    if (startOfDay(fromDate) > endOfDay(toDate)) {
      setError("From date cannot be after to date.");
      return;
    }
    setError("");
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedRoleFilter(roleFilter);
    setSelectedDayKey("");
    setSelectedChartRole("");
    setPage(1);
  };

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        border: "none",
        boxShadow: "none",
        backgroundColor: "#ffffff",
      }}
    >
      <CardContent style={{ padding: isMobile ? "12px" : "16px" }}>
        <Typography variant="h6" style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: "0.25em" }}>
          Onboarding Users Report
        </Typography>
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
          Users onboarded between {formatDisplayDate(startOfDay(appliedFromDate) || new Date())} and{" "}
          {formatDisplayDate(endOfDay(appliedToDate) || new Date())}
          {appliedRoleFilter !== "All" ? ` · Role: ${appliedRoleFilter}` : ""}.
        </Typography>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: isMobile ? "stretch" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            marginBottom: "1em",
          }}
        >
          <TextField
            size="small"
            type="date"
            label="From"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            style={{ minWidth: isMobile ? "100%" : "180px" }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            style={{ minWidth: isMobile ? "100%" : "180px" }}
          />
          <TextField
            select
            size="small"
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minWidth: isMobile ? "100%" : "200px" }}
          >
            <MenuItem value="All">All Roles</MenuItem>
            {USER_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={handleApply}
            style={{
              backgroundColor: "#0c831f",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              height: "40px",
            }}
          >
            Apply
          </Button>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
            <CircularProgress size={20} style={{ color: "#165d46" }} />
            <Typography variant="body2" color="text.secondary">
              Loading onboarding data...
            </Typography>
          </div>
        )}

        {!!error && (
          <Alert severity="error" style={{ marginTop: "12px" }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "1em",
              }}
            >
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Total onboarded
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {filteredUsers.length}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Peak day count
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {dailyTrend.counts.length ? Math.max(...dailyTrend.counts) : 0}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Roles covered
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {roleBreakdown.labels.length}
                </Typography>
              </Paper>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
                gap: "16px",
                marginBottom: "1.25em",
              }}
            >
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Daily onboarding trend
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a bar to filter table)
                  </Typography>
                </Typography>
                {filteredUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No users found for the selected date range.
                  </Typography>
                ) : (
                  <div style={{ position: "relative", height: isMobile ? "220px" : "260px", width: "100%" }}>
                    <Bar
                      data={barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (_event, elements) => {
                          if (!elements?.length) {
                            setSelectedDayKey("");
                            setPage(1);
                            return;
                          }
                          const index = elements[0].index;
                          const dayKey = dailyTrend.dateKeys[index];
                          setSelectedDayKey((prev) => (prev === dayKey ? "" : dayKey));
                          setPage(1);
                        },
                        onHover: (event, elements) => {
                          const target = event?.native?.target;
                          if (target) {
                            target.style.cursor = elements?.length ? "pointer" : "default";
                          }
                        },
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: {
                            ticks: {
                              maxRotation: 45,
                              minRotation: 0,
                              autoSkip: true,
                              maxTicksLimit: isMobile ? 8 : 12,
                            },
                          },
                          y: {
                            beginAtZero: true,
                            suggestedMax: Math.max(3, ...(dailyTrend.counts.length ? dailyTrend.counts : [0])),
                            ticks: {
                              precision: 0,
                              stepSize: 1,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </Paper>

              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Role-wise onboarding
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a slice to filter table)
                  </Typography>
                </Typography>
                {filteredUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No role data for this range.
                  </Typography>
                ) : (
                  <div style={{ position: "relative", height: isMobile ? "220px" : "260px", maxWidth: "280px", margin: "0 auto" }}>
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (_event, elements) => {
                          if (!elements?.length) {
                            setSelectedChartRole("");
                            setPage(1);
                            return;
                          }
                          const index = elements[0].index;
                          const role = roleBreakdown.labels[index];
                          setSelectedChartRole((prev) => (prev === role ? "" : role));
                          setPage(1);
                        },
                        onHover: (event, elements) => {
                          const target = event?.native?.target;
                          if (target) {
                            target.style.cursor = elements?.length ? "pointer" : "default";
                          }
                        },
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: { boxWidth: 12, font: { size: 11 } },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </Paper>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              <Typography variant="subtitle2" style={{ fontWeight: 700 }}>
                {[
                  selectedDayKey
                    ? `On ${formatDisplayDate(startOfDay(selectedDayKey) || new Date())}`
                    : null,
                  selectedChartRole ? `Role: ${selectedChartRole}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Onboarded users"}
              </Typography>
              {(selectedDayKey || selectedChartRole) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedDayKey("");
                    setSelectedChartRole("");
                    setPage(1);
                  }}
                  style={{ textTransform: "none", borderColor: "#165d46", color: "#165d46" }}
                >
                  Clear chart filters
                </Button>
              )}
            </div>

            <TableContainer component={Paper} variant="outlined" style={{ borderColor: "#e8e8e8", boxShadow: "none" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>User ID</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Onboarded On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: "center", color: "#6f7378" }}>
                        No onboarded users in this date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTableUsers.map(({ user, createdDate }) => (
                      <TableRow key={user.id || user.userId || user.email}>
                        <TableCell>{getUserDisplayName(user)}</TableCell>
                        <TableCell>{user.userId || user.userid || "—"}</TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>{user.role || "—"}</TableCell>
                        <TableCell>{formatDisplayDate(createdDate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {tableUsers.length > 0 && totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "1.5em",
                  marginBottom: "0.5em",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  disabled={currentPage === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Typography variant="body2">
                  Page {currentPage} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingUsersReport;
