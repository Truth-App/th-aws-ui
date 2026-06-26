import Navbar from "../components/Navbar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { MdCheckCircle } from "react-icons/md";
import { getOrderById } from "../api/orders";

const IMAGE_BASE_URL = "https://th-app-product.s3.ap-south-2.amazonaws.com/";
const TIMELINE_STEPS = ["PLACED", "PAID", "ACCEPTED", "SHIPPED", "DELIVERED"];
const TIMELINE_STEP_LABELS = {
  PLACED: "Order Placed",
  PAID: "Payment received",
  ACCEPTED: "Order accepted",
  SHIPPED: "Order shipped",
  DELIVERED: "Delivered",
};

const getProductImageUrl = (product) => {
  if (!product?.imageKeys?.length) return "/thriftyhomelogo.png";
  return `${IMAGE_BASE_URL}${product.imageKeys[0]}`;
};

const formatTimelineTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getHistoryTimestamp = (history, expectedStatus) => {
  if (!Array.isArray(history) || !expectedStatus) return "";
  const normalizedTarget = expectedStatus.toUpperCase();

  const matches = history.filter((entry) => (entry?.status || "").toUpperCase() === normalizedTarget);
  if (!matches.length) return "";

  const latest = matches
    .map((entry) => entry.updatedAt || entry.timestamp || entry.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))
    .pop();

  return latest || "";
};

const getTimelineIndex = (details) => {
  const normalizedOrderStatus = (details?.orderStatus || "").toUpperCase();
  const normalizedPaymentStatus = (details?.paymentStatus || "").toUpperCase();

  if (normalizedOrderStatus === "DELIVERED") return 4;
  if (normalizedOrderStatus === "SHIPPED") return 3;
  if (normalizedOrderStatus === "ACCEPTED") return 2;
  if (normalizedPaymentStatus === "PAID") return 1;
  return 0;
};

const getTimelineStepTimes = (details) => {
  const orderHistory = details?.orderHistory || [];
  const paymentHistory = details?.paymentHistory || [];

  return {
    PLACED: getHistoryTimestamp(orderHistory, "PLACED") || details?.createdAt || "",
    PAID: getHistoryTimestamp(paymentHistory, "PAID") || "",
    ACCEPTED: getHistoryTimestamp(orderHistory, "ACCEPTED"),
    SHIPPED: getHistoryTimestamp(orderHistory, "SHIPPED"),
    DELIVERED: getHistoryTimestamp(orderHistory, "DELIVERED"),
  };
};

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderData, setOrderData] = useState(null);

  // Razorpay locks document.body scroll when its modal opens.
  // If React navigates away before Razorpay restores it, the page is unscrollable.
  // This effect guarantees scroll is always re-enabled when this page mounts.
  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setOrderLoading(true);
      setOrderError("");

      try {
        const response = await getOrderById(orderId);
        setOrderData(response);
        console.log("Fetched order details:", response);
      } catch {
        setOrderError("Failed to fetch order details.");
      } finally {
        setOrderLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const details = orderData?.orderDetails;
  const products = details?.products || [];
  const currentTimelineIndex = getTimelineIndex(details);
  const timelineStepTimes = getTimelineStepTimes(details);
  const totalAmount = products.reduce((sum, item) => sum + (item.subTotal || (item.price || 0) * (item.quantity || 0)), 0);
  const totalMrp = products.reduce((sum, item) => sum + (item.mrpPrice || 0) * (item.quantity || 0), 0);
  const totalSaved = totalMrp - totalAmount;
  const savedPercentage = totalMrp > 0 ? (totalSaved / totalMrp) * 100 : 0;

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", width: "100%", maxWidth: "900px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MdCheckCircle size={42} color="#2e7d32" />
            <div>
              <Typography variant="h5" style={{ fontWeight: 700 }}>
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track order status and review purchased products.
              </Typography>
            </div>
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

        {!orderId && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent>
              <Typography color="error">Order ID is missing in the URL.</Typography>
            </CardContent>
          </Card>
        )}

        {orderLoading && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CircularProgress size={22} style={{ color: "#165d46" }} />
              <Typography>Fetching order details...</Typography>
            </CardContent>
          </Card>
        )}

        {!orderLoading && orderError && (
          <Card variant="outlined" style={{ width: "100%", maxWidth: "900px", borderRadius: "12px" }}>
            <CardContent>
              <Typography color="error">{orderError}</Typography>
            </CardContent>
          </Card>
        )}

        {!orderLoading && details && (
          <>
            <Card
              variant="outlined"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "12px",
              }}
            >
              <CardContent>
                <Typography variant="h6" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Order Timeline
                </Typography>
                <div style={{ overflowX: "auto", paddingBottom: "6px" }}>
                  <div style={{ display: "flex", minWidth: "740px", alignItems: "center", gap: "8px" }}>
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isActive = idx <= currentTimelineIndex;
                      const isCurrent = idx === currentTimelineIndex;
                      const isNextStep = idx === currentTimelineIndex + 1;
                      const stepTime = timelineStepTimes[step];
                      const formattedStepTime = formatTimelineTime(stepTime);

                      return (
                        <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "110px" }}>
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                border: isActive ? "2px solid #2e7d32" : "2px solid #c2c2c2",
                                backgroundColor: isActive ? "#e9f5ec" : "#f5f5f5",
                                color: isActive ? "#2e7d32" : "#9e9e9e",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.85rem",
                              }}
                            >
                              {idx + 1}
                            </div>
                            <Typography
                              variant="caption"
                              style={{
                                fontWeight: isCurrent ? 700 : 500,
                                color: isActive ? "#2e7d32" : "#777",
                                textAlign: "center",
                              }}
                            >
                              {TIMELINE_STEP_LABELS[step] || step}
                            </Typography>
                            <div style={{ minHeight: "20px", display: "flex", alignItems: "center" }}>
                              {isActive && formattedStepTime && (
                                <Chip
                                  label={formattedStepTime}
                                  size="small"
                                  style={{
                                    height: "20px",
                                    backgroundColor: "#eef7f1",
                                    color: "#2e7d32",
                                    border: "1px solid #cae7d3",
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                              {!isActive && isNextStep && (
                                <Chip
                                  label="In Progress"
                                  size="small"
                                  style={{
                                    height: "20px",
                                    backgroundColor: "#fff4e5",
                                    color: "#ed6c02",
                                    border: "1px solid #ffd8a8",
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div
                              style={{
                                flex: 1,
                                height: "2px",
                                margin: "0 8px",
                                backgroundColor: idx < currentTimelineIndex ? "#2e7d32" : "#d6d6d6",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "12px",
              }}
            >
              <CardContent>
                <Typography variant="h6" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Shipping Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {details.user?.fullName || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary" style={{ marginTop: "6px" }}>
                  {details.user?.phone || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary" style={{ marginTop: "6px", fontWeight: 600 }}>
                  Delivery Address:
                </Typography>
                <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                  {details.shippingAddress?.address || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                  {details.shippingAddress?.city || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                  {details.shippingAddress?.pincode || "-"}
                </Typography>
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "12px",
              }}
            >
              <CardContent>
                <Typography variant="h6" style={{ fontWeight: 700, marginBottom: "12px" }}>
                  Products
                </Typography>
                {products.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No product details available.</Typography>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {products.map((item, idx) => {
                      const quantity = item.quantity || 0;
                      const price = item.price || 0;
                      const mrpPrice = item.mrpPrice || 0;
                      const subTotal = item.subTotal || price * quantity;
                      const saved = (mrpPrice - price) * quantity;

                      return (
                        <Card key={`${item.title || "item"}-${idx}`} variant="outlined" style={{ borderRadius: "10px" }}>
                          <CardContent style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <img
                              src={getProductImageUrl(item)}
                              alt={item.title || "Product image"}
                              style={{ width: "82px", height: "82px", objectFit: "contain", borderRadius: "8px", backgroundColor: "#f5f5f5" }}
                            />
                            <div style={{ flex: 1, minWidth: "220px" }}>
                              <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
                                {item.title || "-"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                                Qty: {quantity}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Price: INR {price.toFixed(2)} | MRP: INR {mrpPrice.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Subtotal: INR {subTotal.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" style={{ color: "#2e7d32", fontWeight: 600 }}>
                                Saved: INR {saved.toFixed(2)}
                              </Typography>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    <Card variant="outlined" style={{ borderRadius: "10px", marginTop: "4px" }}>
                      <CardContent>
                        <Typography variant="subtitle2" style={{ fontWeight: 700, marginBottom: "8px" }}>
                          Price Summary
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          MRP: INR {totalMrp.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                          Amount: INR {totalAmount.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" style={{ color: "#2e7d32", fontWeight: 600, marginTop: "4px" }}>
                          Saved: INR {totalSaved.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" style={{ color: "#2e7d32", fontWeight: 600, marginTop: "4px" }}>
                          Saved %: {savedPercentage.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "6px" }}>
                      Email: thriftyHome@gmail.com | Ph no: 12313221
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </>
  );
};

export default OrderSuccess;
