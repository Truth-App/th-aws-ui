import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchAuthSession } from "aws-amplify/auth";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
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

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

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
    <Card
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e8efeb",
      }}
    >
      <CardContent style={{ padding: isMobile ? "8px 12px" : "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "1em",
          }}
        >
          <div>
            <Typography variant="h6" style={{ fontWeight: 700, color: "#165d46" }}>
              My Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View order summaries and open detailed tracking.
            </Typography>
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "1em" }}>
            <CircularProgress size={22} style={{ color: "#165d46" }} />
            <Typography>Fetching orders...</Typography>
          </div>
        )}

        {!loading && error && (
          <Typography color="error" style={{ marginTop: "1em" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && orders.length === 0 && (
          <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
            No orders found.
          </Typography>
        )}

        {!loading && !error && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "0.5em" }}>
            {orders.map((order) => {
              const totalItems = (order.products || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
              return (
                <Card key={order.orderId} variant="outlined" style={{ borderRadius: "12px" }}>
                  <CardContent
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap",
                      padding: isMobile ? "12px" : "16px",
                    }}
                  >
                    <div style={{ minWidth: "200px", flex: 1 }}>
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

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersManagement;
