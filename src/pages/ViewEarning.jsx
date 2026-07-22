import AdminPageLayout from "../components/AdminPageLayout";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { EARNINGS_API_URL } from "../constants/api";

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
        .map((item, index) => ({
          id: String(item?.userId || item?.id || item?.email || index + 1),
          name: `${item?.firstName || item?.firstname || ""} ${item?.lastName || item?.lastname || ""}`.trim() || "-",
          email: item?.email || "-",
          role: item?.role || "-",
          mobile: item?.mobile || item?.phone || "-",
          earnings: formatInr(item?.totalEarnings ?? 0),
        })),
    [users],
  );

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
            <TableContainer component={Paper} style={{ marginTop: "16px", border: "1px solid var(--brand-border)", boxShadow: "none" }}>
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
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.mobile}</TableCell>
                        <TableCell style={{ fontWeight: 600, color: "var(--brand-primary)" }}>{row.earnings}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default ViewEarning;
