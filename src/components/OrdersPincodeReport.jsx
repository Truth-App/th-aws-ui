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
import { fetchAuthSession } from "aws-amplify/auth";
import { getOrders } from "../api/orders";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const PINCODE_COLORS = [
  "#165d46",
  "#0c831f",
  "#1976d2",
  "#ef6c00",
  "#7b1fa2",
  "#c62828",
  "#00838f",
  "#546e7a",
  "#6a1b9a",
  "#2e7d32",
];

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    fromDate: toInputDate(start),
    toDate: toInputDate(end),
  };
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

const getOrderCreatedDate = (order) => {
  const raw = order?.createdAt || "";
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getOrderPincode = (order) => {
  const candidates = [
    order?.shippingAddress?.pincode,
    order?.shippingAddress?.pinCode,
    order?.shippingAddress?.postalCode,
    order?.deliveryAddress?.pincode,
    order?.deliveryAddress?.pinCode,
    order?.deliveryAddress?.postalCode,
    order?.address?.pincode,
    order?.address?.pinCode,
    order?.address?.postalCode,
    order?.customerAddress?.pincode,
    order?.customerAddress?.pinCode,
    order?.customerAddress?.postalCode,
    order?.pincode,
    order?.pinCode,
  ];

  const match = candidates.find((value) => String(value || "").trim());
  return match ? String(match).trim() : "Unknown";
};

const getOrderCity = (order) =>
  order?.shippingAddress?.city ||
  order?.deliveryAddress?.city ||
  order?.address?.city ||
  order?.customerAddress?.city ||
  "—";

const getCustomerName = (order) => order?.user?.fullName || order?.user?.name || "—";

const getOrderAmount = (order) => Number(order?.amount?.total || 0);

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const OrdersPincodeReport = ({ embedded = false }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [pincodeFilter, setPincodeFilter] = useState("All");
  const [appliedFromDate, setAppliedFromDate] = useState(defaults.fromDate);
  const [appliedToDate, setAppliedToDate] = useState(defaults.toDate);
  const [appliedPincodeFilter, setAppliedPincodeFilter] = useState("All");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedChartPincode, setSelectedChartPincode] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        if (!accessToken) {
          throw new Error("You are not signed in. Please sign in to view orders.");
        }

        const data = await getOrders(accessToken);
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setOrders([]);
        setError(err?.message || "Failed to load orders for pincode report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const from = startOfDay(appliedFromDate);
    const to = endOfDay(appliedToDate);
    if (!from || !to) return [];

    return orders
      .map((order) => {
        const createdDate = getOrderCreatedDate(order);
        if (!createdDate) return null;
        return {
          order,
          createdDate,
          pincode: getOrderPincode(order),
        };
      })
      .filter(Boolean)
      .filter(({ createdDate }) => createdDate >= from && createdDate <= to)
      .filter(({ pincode }) => {
        if (appliedPincodeFilter === "All") return true;
        return pincode === appliedPincodeFilter;
      })
      .sort((a, b) => b.createdDate - a.createdDate);
  }, [orders, appliedFromDate, appliedToDate, appliedPincodeFilter]);

  const availablePincodes = useMemo(() => {
    const pins = new Set(orders.map((order) => getOrderPincode(order)));
    return [...pins].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [orders]);

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

    filteredOrders.forEach(({ createdDate }) => {
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
  }, [filteredOrders, appliedFromDate, appliedToDate]);

  const tableOrders = useMemo(() => {
    return filteredOrders.filter(({ pincode, createdDate }) => {
      const matchesDay = !selectedDayKey || toInputDate(createdDate) === selectedDayKey;
      const matchesPincode = !selectedChartPincode || pincode === selectedChartPincode;
      return matchesDay && matchesPincode;
    });
  }, [filteredOrders, selectedDayKey, selectedChartPincode]);

  const totalPages = Math.max(1, Math.ceil(tableOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTableOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tableOrders.slice(start, start + PAGE_SIZE);
  }, [tableOrders, currentPage]);

  const pincodeBreakdown = useMemo(() => {
    const sourceOrders = selectedDayKey
      ? filteredOrders.filter(({ createdDate }) => toInputDate(createdDate) === selectedDayKey)
      : filteredOrders;

    const counts = {};
    sourceOrders.forEach(({ pincode }) => {
      counts[pincode] = (counts[pincode] || 0) + 1;
    });

    const pincodes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      labels: pincodes,
      counts: pincodes.map((pin) => counts[pin]),
      colors: pincodes.map((_, index) => PINCODE_COLORS[index % PINCODE_COLORS.length]),
    };
  }, [filteredOrders, selectedDayKey]);

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, { order }) => sum + getOrderAmount(order), 0),
    [filteredOrders],
  );

  const uniquePincodeCount = useMemo(
    () => new Set(filteredOrders.map(({ pincode }) => pincode)).size,
    [filteredOrders],
  );

  const barData = {
    labels: dailyTrend.labels,
    datasets: [
      {
        label: "Orders",
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
    labels: pincodeBreakdown.labels,
    datasets: [
      {
        data: pincodeBreakdown.counts,
        backgroundColor: pincodeBreakdown.colors,
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  const handleApply = () => {
    setError("");
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedPincodeFilter(pincodeFilter);
    setSelectedDayKey("");
    setSelectedChartPincode("");
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
      <CardContent style={{ padding: embedded ? "8px 0 0" : isMobile ? "12px" : "16px" }}>
        {!embedded && (
          <Typography variant="h6" style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: "0.25em" }}>
            Orders Report by Pincode
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
          Orders between {formatDisplayDate(startOfDay(appliedFromDate) || new Date())} and{" "}
          {formatDisplayDate(endOfDay(appliedToDate) || new Date())}
          {appliedPincodeFilter !== "All" ? ` · Pincode: ${appliedPincodeFilter}` : ""}.
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
            label="Pincode"
            value={pincodeFilter}
            onChange={(e) => setPincodeFilter(e.target.value)}
            style={{ minWidth: isMobile ? "100%" : "200px" }}
          >
            <MenuItem value="All">All Pincodes</MenuItem>
            {availablePincodes.map((pin) => (
              <MenuItem key={pin} value={pin}>
                {pin}
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
              Loading orders data...
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
                  Total orders
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {filteredOrders.length}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Total revenue
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Pincodes covered
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {uniquePincodeCount}
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
                  Daily orders trend
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a bar to filter table)
                  </Typography>
                </Typography>
                {filteredOrders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No orders found for the selected filters.
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
                  Orders by pincode
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a slice to filter table)
                  </Typography>
                </Typography>
                {filteredOrders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No pincode data for this range.
                  </Typography>
                ) : (
                  <div
                    style={{
                      position: "relative",
                      height: isMobile ? "220px" : "260px",
                      maxWidth: "280px",
                      margin: "0 auto",
                    }}
                  >
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (_event, elements) => {
                          if (!elements?.length) {
                            setSelectedChartPincode("");
                            setPage(1);
                            return;
                          }
                          const index = elements[0].index;
                          const pin = pincodeBreakdown.labels[index];
                          setSelectedChartPincode((prev) => (prev === pin ? "" : pin));
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
                  selectedChartPincode ? `Pincode: ${selectedChartPincode}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Orders"}
              </Typography>
              {(selectedDayKey || selectedChartPincode) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedDayKey("");
                    setSelectedChartPincode("");
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
                    <TableCell style={{ fontWeight: 700 }}>Order ID</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Pincode</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>City</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Ordered On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} style={{ textAlign: "center", color: "#6f7378" }}>
                        No orders in this date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTableOrders.map(({ order, createdDate, pincode }) => (
                      <TableRow key={order.orderId || order.id}>
                        <TableCell>{String(order.orderId || "—").slice(0, 8)}</TableCell>
                        <TableCell>{pincode}</TableCell>
                        <TableCell>{getOrderCity(order)}</TableCell>
                        <TableCell>{getCustomerName(order)}</TableCell>
                        <TableCell>{order.orderStatus || "—"}</TableCell>
                        <TableCell>{formatCurrency(getOrderAmount(order))}</TableCell>
                        <TableCell>{formatDisplayDate(createdDate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {tableOrders.length > 0 && totalPages > 1 && (
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

export default OrdersPincodeReport;
