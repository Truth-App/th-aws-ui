import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchAuthSession } from "aws-amplify/auth";
import Navbar from "../components/Navbar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { getOrders } from "../api/orders";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusColor = (status) => {
  const normalized = (status || "").toUpperCase();
  if (["DELIVERED", "PAID", "SUCCESS"].includes(normalized)) return "#2e7d32";
  if (["SHIPPED", "ACCEPTED", "PLACED"].includes(normalized)) return "#ed6c02";
  return "#555";
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();

        if (!accessToken) {
          setError("You are not signed in. Please sign in with Google.");
          setLoading(false);
          return;
        }

        const data = await getOrders(accessToken);
        const sortedOrders = Array.isArray(data)
          ? [...data].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
          : [];
        setOrders(sortedOrders);
      } catch (fetchError) {
        console.error("Failed to fetch orders:", fetchError);
        setError("Unable to load orders right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, []);

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "left",
          padding: "20px",
          gap: "16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "900px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <Typography variant="h5" style={{ fontWeight: 700 }}>
              My Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your order summaries and open detailed tracking.
            </Typography>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            style={{
              backgroundColor: "#165d46",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              padding: "10px 24px",
              whiteSpace: "nowrap",
            }}
          >
            Continue Shopping
          </Button>
        </div>

        {loading && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CircularProgress size={22} style={{ color: "#165d46" }} />
              <Typography>Fetching your orders...</Typography>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        )}

        {!loading && !error && orders.length === 0 && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent>
              <Typography>No orders found for your account.</Typography>
            </CardContent>
          </Card>
        )}

        {!loading && !error && orders.length > 0 &&
          orders.map((order) => {
            const totalItems = (order.products || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            return (
              <Card key={order.orderId} variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
                <CardContent style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: "250px", flex: 1 }}>
                    <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
                      Order #{(order.orderId || "-").slice(0, 8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                      Date: {formatDate(order.createdAt)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                      Items: {totalItems} | Amount: INR {(order.amount?.total || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                      {order.products?.[0]?.title || "-"}
                      {order.products?.length > 1 ? ` +${order.products.length - 1} more` : ""}
                    </Typography>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Chip
                      label={order.orderStatus || "UNKNOWN"}
                      size="small"
                      style={{
                        backgroundColor: "#f1f6f3",
                        color: statusColor(order.orderStatus),
                        border: "1px solid #dce9e2",
                        fontWeight: 600,
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/order?orderId=${encodeURIComponent(order.orderId)}`)}
                      style={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "8px",
                        borderColor: "#165d46",
                        color: "#165d46",
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </>
  );
};

export default Orders;
