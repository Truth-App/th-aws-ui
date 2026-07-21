import AdminPageLayout from "../components/AdminPageLayout";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { EARNINGS_API_URL } from "../constants/api";
import { USER_ROLES } from "../constants/roles";

const PAGE_SIZE = 10;
const EXCLUDED_EARNINGS_ROLES = new Set(["Administrator", "Customer"]);
const EARNINGS_ROLE_OPTIONS = USER_ROLES.filter((role) => !EXCLUDED_EARNINGS_ROLES.has(role));

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);

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
        .filter((item) => !EXCLUDED_EARNINGS_ROLES.has(item?.role))
        .filter((item) => roleFilter === "All" || item?.role === roleFilter)
        .map((item, index) => ({
          id: String(item?.userId || item?.id || item?.email || index + 1),
          name:
            `${item?.firstName || item?.firstname || ""} ${item?.lastName || item?.lastname || ""}`.trim() ||
            "-",
          email: item?.email || "-",
          role: item?.role || "-",
          mobile: item?.mobile || item?.phone || "-",
          earnings: formatInr(item?.totalEarnings ?? 0),
        })),
    [users, roleFilter],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  return (
    <AdminPageLayout activeFeature="view-earnings">
      <Card
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          border: "1px solid var(--brand-border)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent>
        <Typography variant="h6" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
            View Earnings Summary
          </Typography>

          <TextField
            select
            size="small"
            label="Role"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
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

          {loading && (
            <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
              <CircularProgress size={20} style={{ color: "#165d46" }} />
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
                style={{ marginTop: "16px", border: "1px solid #e8efeb", boxShadow: "none" }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
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
                        <TableCell colSpan={5} style={{ textAlign: "center", color: "#6f7378" }}>
                          No users found{roleFilter !== "All" ? ` for role ${roleFilter}` : ""}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.role}</TableCell>
                          <TableCell>{row.mobile}</TableCell>
                          <TableCell style={{ fontWeight: 600, color: "#165d46" }}>{row.earnings}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {rows.length > 0 && totalPages > 1 && (
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
    </AdminPageLayout>
  );
};

export default ViewEarning;
