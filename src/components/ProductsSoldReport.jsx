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
import { PRODUCT_API_URL } from "../constants/api";
import {
  CHART_COLORS,
  buildDailyKeys,
  endOfDay,
  formatCurrency,
  formatDayLabel,
  formatDisplayDate,
  getDefaultDateRange,
  getOrderCreatedDate,
  getProductId,
  getProductLineAmount,
  startOfDay,
  toInputDate,
} from "../helpers/reportHelpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const ProductsSoldReport = ({ embedded = false }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [appliedFromDate, setAppliedFromDate] = useState(defaults.fromDate);
  const [appliedToDate, setAppliedToDate] = useState(defaults.toDate);
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState("All");
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [selectedChartCategory, setSelectedChartCategory] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        if (!accessToken) {
          throw new Error("You are not signed in. Please sign in to view products sold.");
        }

        const [ordersData, productsResponse] = await Promise.all([
          getOrders(accessToken),
          fetch(PRODUCT_API_URL).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch products. Status: ${response.status}`);
            }
            return response.json();
          }),
        ]);

        if (cancelled) return;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      } catch (err) {
        if (cancelled) return;
        setOrders([]);
        setProducts([]);
        setError(err?.message || "Failed to load products sold report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      if (product?.id) map.set(String(product.id), product);
    });
    return map;
  }, [products]);

  const soldLineItems = useMemo(() => {
    const from = startOfDay(appliedFromDate);
    const to = endOfDay(appliedToDate);
    if (!from || !to) return [];

    const rows = [];

    orders.forEach((order) => {
      const createdDate = getOrderCreatedDate(order);
      if (!createdDate || createdDate < from || createdDate > to) return;

      (order.products || []).forEach((item) => {
        const productId = String(getProductId(item) || "");
        const catalogProduct = productById.get(productId);
        const category =
          catalogProduct?.category ||
          item?.category ||
          item?.categoryName ||
          "Uncategorized";
        const title =
          item?.title ||
          catalogProduct?.title ||
          productId ||
          "Unknown product";
        const quantity = Number(item?.quantity) || 0;
        const amount = getProductLineAmount(item);

        rows.push({
          orderId: order.orderId || order.id,
          createdDate,
          productId,
          title,
          category,
          quantity,
          amount,
        });
      });
    });

    return rows
      .filter((row) => appliedCategoryFilter === "All" || row.category === appliedCategoryFilter)
      .sort((a, b) => b.createdDate - a.createdDate);
  }, [orders, productById, appliedFromDate, appliedToDate, appliedCategoryFilter]);

  const availableCategories = useMemo(() => {
    const categories = new Set();
    products.forEach((product) => {
      if (product?.category) categories.add(product.category);
    });
    orders.forEach((order) => {
      (order.products || []).forEach((item) => {
        const productId = String(getProductId(item) || "");
        const catalogProduct = productById.get(productId);
        const category =
          catalogProduct?.category || item?.category || item?.categoryName || "Uncategorized";
        categories.add(category);
      });
    });
    return [...categories].sort((a, b) => a.localeCompare(b));
  }, [products, orders, productById]);

  const aggregatedProducts = useMemo(() => {
    const map = new Map();

    soldLineItems.forEach((row) => {
      if (selectedDayKey && toInputDate(row.createdDate) !== selectedDayKey) return;
      if (selectedChartCategory && row.category !== selectedChartCategory) return;

      const key = `${row.productId || row.title}::${row.category}`;
      const existing = map.get(key) || {
        productId: row.productId,
        title: row.title,
        category: row.category,
        quantity: 0,
        amount: 0,
        orderIds: new Set(),
      };
      existing.quantity += row.quantity;
      existing.amount += row.amount;
      if (row.orderId) existing.orderIds.add(row.orderId);
      map.set(key, existing);
    });

    return [...map.values()]
      .map((item) => ({
        ...item,
        orderCount: item.orderIds.size,
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [soldLineItems, selectedDayKey, selectedChartCategory]);

  const totalPages = Math.max(1, Math.ceil(aggregatedProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return aggregatedProducts.slice(start, start + PAGE_SIZE);
  }, [aggregatedProducts, currentPage]);

  const dailyTrend = useMemo(() => {
    const dateKeys = buildDailyKeys(appliedFromDate, appliedToDate);
    const countsByDay = Object.fromEntries(dateKeys.map((key) => [key, 0]));

    soldLineItems.forEach((row) => {
      const key = toInputDate(row.createdDate);
      if (key in countsByDay) countsByDay[key] += row.quantity;
    });

    return {
      dateKeys,
      labels: dateKeys.map(formatDayLabel),
      counts: dateKeys.map((key) => countsByDay[key]),
    };
  }, [soldLineItems, appliedFromDate, appliedToDate]);

  const categoryBreakdown = useMemo(() => {
    const sourceRows = selectedDayKey
      ? soldLineItems.filter((row) => toInputDate(row.createdDate) === selectedDayKey)
      : soldLineItems;

    const counts = {};
    sourceRows.forEach((row) => {
      counts[row.category] = (counts[row.category] || 0) + row.quantity;
    });

    const categories = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      labels: categories,
      counts: categories.map((category) => counts[category]),
      colors: categories.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
    };
  }, [soldLineItems, selectedDayKey]);

  const totalUnits = useMemo(
    () => soldLineItems.reduce((sum, row) => sum + row.quantity, 0),
    [soldLineItems],
  );
  const totalRevenue = useMemo(
    () => soldLineItems.reduce((sum, row) => sum + row.amount, 0),
    [soldLineItems],
  );
  const uniqueProducts = useMemo(
    () => new Set(soldLineItems.map((row) => row.productId || row.title)).size,
    [soldLineItems],
  );

  const barData = {
    labels: dailyTrend.labels,
    datasets: [
      {
        label: "Units sold",
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
    labels: categoryBreakdown.labels,
    datasets: [
      {
        data: categoryBreakdown.counts,
        backgroundColor: categoryBreakdown.colors,
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  const handleApply = () => {
    setError("");
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedCategoryFilter(categoryFilter);
    setSelectedDayKey("");
    setSelectedChartCategory("");
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
            Products Sold Report
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" style={{ marginBottom: "1em" }}>
          Products sold between {formatDisplayDate(startOfDay(appliedFromDate) || new Date())} and{" "}
          {formatDisplayDate(endOfDay(appliedToDate) || new Date())}
          {appliedCategoryFilter !== "All" ? ` · Category: ${appliedCategoryFilter}` : ""}.
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
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ minWidth: isMobile ? "100%" : "200px" }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {availableCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
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
              Loading products sold data...
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
                  Units sold
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {totalUnits}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Sales value
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Paper>
              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="caption" color="text.secondary">
                  Products sold
                </Typography>
                <Typography variant="h5" style={{ fontWeight: 700, color: "#165d46" }}>
                  {uniqueProducts}
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
                  Daily units sold
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a bar to filter table)
                  </Typography>
                </Typography>
                {soldLineItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No products sold for the selected filters.
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
                          if (target) target.style.cursor = elements?.length ? "pointer" : "default";
                        },
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            ticks: {
                              maxRotation: 45,
                              autoSkip: true,
                              maxTicksLimit: isMobile ? 8 : 12,
                            },
                          },
                          y: {
                            beginAtZero: true,
                            ticks: { precision: 0, stepSize: 1 },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </Paper>

              <Paper variant="outlined" style={{ padding: "14px", borderColor: "#e8e8e8" }}>
                <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Units by category
                  <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: "8px" }}>
                    (click a slice to filter table)
                  </Typography>
                </Typography>
                {soldLineItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No category data for this range.
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
                            setSelectedChartCategory("");
                            setPage(1);
                            return;
                          }
                          const index = elements[0].index;
                          const category = categoryBreakdown.labels[index];
                          setSelectedChartCategory((prev) => (prev === category ? "" : category));
                          setPage(1);
                        },
                        onHover: (event, elements) => {
                          const target = event?.native?.target;
                          if (target) target.style.cursor = elements?.length ? "pointer" : "default";
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
                  selectedChartCategory ? `Category: ${selectedChartCategory}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Products sold"}
              </Typography>
              {(selectedDayKey || selectedChartCategory) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedDayKey("");
                    setSelectedChartCategory("");
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
                    <TableCell style={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Units sold</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Sales value</TableCell>
                    <TableCell style={{ fontWeight: 700 }}>Orders</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aggregatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: "center", color: "#6f7378" }}>
                        No products sold in this date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((item) => (
                      <TableRow key={`${item.productId || item.title}-${item.category}`}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.orderCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {aggregatedProducts.length > 0 && totalPages > 1 && (
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

export default ProductsSoldReport;
