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
import {
  MdAllInbox,
  MdShoppingCart,
  MdPayments,
  MdFactCheck,
  MdLocalShipping,
  MdInventory,
} from "react-icons/md";
import { getOrders } from "../api/orders";

const TIMELINE_FILTER_STEPS = ["PLACED", "PAID", "SHIPPED", "DELIVERED"];
const TIMELINE_STEP_LABELS = {
  PLACED: "Placed",
  PAID: "Approval",
  ACCEPTED: "Accepted",
  SHIPPED: "Shipment",
  DELIVERED: "Delivered",
};

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

const getOrderTimelineStatus = (order) => {
  const normalizedOrderStatus = (order?.orderStatus || "").toUpperCase();
  const normalizedPaymentStatus = (order?.paymentStatus || "").toUpperCase();

  // Steps beyond PAID take priority
  if (["ACCEPTED", "SHIPPED", "DELIVERED"].includes(normalizedOrderStatus)) {
    return normalizedOrderStatus;
  }

  // Payment PAID takes priority over order status of PLACED
  if (["PAID", "SUCCESS"].includes(normalizedPaymentStatus) || ["PAID", "SUCCESS"].includes(normalizedOrderStatus)) {
    return "PAID";
  }

  if (normalizedOrderStatus === "PLACED") {
    return "PLACED";
  }

  return "PLACED";
};

const getTimelineStepIcon = (step) => {
  if (step === "ALL") return <MdAllInbox size={16} />;
  if (step === "PLACED") return <MdShoppingCart size={16} />;
  if (step === "PAID") return <MdPayments size={16} />;
  if (step === "ACCEPTED") return <MdFactCheck size={16} />;
  if (step === "SHIPPED") return <MdLocalShipping size={16} />;
  if (step === "DELIVERED") return <MdInventory size={16} />;
  return null;
};

const OrdersManagement = ({
  title = "My Orders",
  description = "View order summaries and open detailed tracking.",
  showStatusTimelineFilter = false,
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [approvalChecks, setApprovalChecks] = useState({
    pendingApproval: true,
    approved: true,
    rejected: true,
  });
  const [shipmentChecks, setShipmentChecks] = useState({
    pendingShipment: true,
    approvedShipment: true,
    rejectedShipment: true,
  });
  const [deliveryChecks, setDeliveryChecks] = useState({
    all: true,
    deliveryCompleted: true,
    deliveryFailed: true,
  });
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

  const visibleOrders = orders.filter((order) => {
    if (selectedStatus === "ALL") return true;

    const normalizedOrderStatus = (order?.orderStatus || "").toUpperCase();
    const normalizedPaymentStatus = (order?.paymentStatus || "").toUpperCase();
    const normalizedShipmentStatus = (
      order?.shipmentStatus ||
      order?.shipmentApprovalStatus ||
      order?.shipmentDecision ||
      ""
    ).toUpperCase();
    const normalizedDeliveryApprovalStatus = (order?.deliveryApprovalStatus || "").toUpperCase().trim();

    if (selectedStatus === "PLACED") {
      return normalizedOrderStatus === "PLACED" && normalizedPaymentStatus === "PAYMENT_PENDING";
    }

    if (selectedStatus === "PAID") {
      if (normalizedPaymentStatus !== "PAID") return false;

      const matchesPendingApproval = approvalChecks.pendingApproval && normalizedOrderStatus === "PLACED";
      const matchesApproved = approvalChecks.approved && normalizedOrderStatus === "ORDER_APPROVED";
      const matchesRejected = approvalChecks.rejected && normalizedOrderStatus === "REJECTED";

      return matchesPendingApproval || matchesApproved || matchesRejected;
    }

    if (selectedStatus === "SHIPPED") {
      const matchesPendingShipment =
        shipmentChecks.pendingShipment &&
        (["PENDING", "SHIPMENT_PENDING", "PENDING_SHIPMENT"].includes(normalizedShipmentStatus) ||
          (!normalizedShipmentStatus && normalizedOrderStatus === "ORDER_APPROVED"));

      const matchesApprovedShipment =
        shipmentChecks.approvedShipment &&
        (["APPROVED", "SHIPMENT_APPROVED", "APPROVED_SHIPMENT"].includes(normalizedShipmentStatus) ||
          normalizedOrderStatus === "SHIPMENT_APPROVED");

      const matchesRejectedShipment =
        shipmentChecks.rejectedShipment &&
        (["REJECTED", "SHIPMENT_REJECTED", "REJECTED_SHIPMENT"].includes(normalizedShipmentStatus) ||
          normalizedOrderStatus === "SHIPMENT_REJECTED");

      return matchesPendingShipment || matchesApprovedShipment || matchesRejectedShipment;
    }

    if (selectedStatus === "DELIVERED") {
      const matchesDeliveryCompleted =
        deliveryChecks.deliveryCompleted &&
        (
          normalizedDeliveryApprovalStatus === "DELIVERY_COMPLETED" ||
          ["DELIVERY_COMPLETED", "DELIVERED"].includes(normalizedOrderStatus)
        );

      const matchesDeliveryFailed =
        deliveryChecks.deliveryFailed &&
        (normalizedDeliveryApprovalStatus === "DELIVERY_FAILED" || normalizedOrderStatus === "DELIVERY_FAILED");

      return matchesDeliveryCompleted || matchesDeliveryFailed;
    }

    return getOrderTimelineStatus(order) === selectedStatus;
  });

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
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </div>
        </div>

        {showStatusTimelineFilter && !loading && !error && (
          <div
            style={{
              border: "1px solid #dce9e2",
              borderRadius: "12px",
              backgroundColor: "#f8fcfa",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "#165d46", marginBottom: "10px" }}>
              Order Timeline Filter
            </Typography>

            <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", minWidth: "760px", gap: "8px" }}>
                {["ALL", ...TIMELINE_FILTER_STEPS].map((step, index, list) => {
                  const isSelected = selectedStatus === step;
                  const label = step === "ALL" ? "All" : TIMELINE_STEP_LABELS[step] || step;

                  return (
                    <div key={step} style={{ display: "flex", alignItems: "center" }}>
                      <Button
                        variant={isSelected ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setSelectedStatus(step)}
                        style={{
                          textTransform: "none",
                          borderRadius: "999px",
                          fontWeight: 700,
                          borderColor: "#165d46",
                          color: isSelected ? "#fff" : "#165d46",
                          backgroundColor: isSelected ? "#165d46" : "#fff",
                          whiteSpace: "nowrap",
                          minWidth: "fit-content",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {getTimelineStepIcon(step)}
                          {label}
                        </span>
                      </Button>
                      {index < list.length - 1 && (
                        <div style={{ width: "20px", height: "2px", backgroundColor: "#cfe3d9", margin: "0 4px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showStatusTimelineFilter && selectedStatus === "PAID" && !loading && !error && (
          <div
            style={{
              border: "1px solid #dce9e2",
              borderRadius: "12px",
              backgroundColor: "#f8fcfa",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "#165d46", marginBottom: "10px" }}>
              Approval Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={approvalChecks.pendingApproval}
                  onChange={(event) =>
                    setApprovalChecks((previous) => ({
                      ...previous,
                      pendingApproval: event.target.checked,
                    }))
                  }
                />
                <span>Pending Approval</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={approvalChecks.approved}
                  onChange={(event) =>
                    setApprovalChecks((previous) => ({
                      ...previous,
                      approved: event.target.checked,
                    }))
                  }
                />
                <span>Approved</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={approvalChecks.rejected}
                  onChange={(event) =>
                    setApprovalChecks((previous) => ({
                      ...previous,
                      rejected: event.target.checked,
                    }))
                  }
                />
                <span>Rejected</span>
              </label>
            </div>
          </div>
        )}

        {showStatusTimelineFilter && selectedStatus === "SHIPPED" && !loading && !error && (
          <div
            style={{
              border: "1px solid #dce9e2",
              borderRadius: "12px",
              backgroundColor: "#f8fcfa",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "#165d46", marginBottom: "10px" }}>
              Shipment Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={shipmentChecks.pendingShipment}
                  onChange={(event) =>
                    setShipmentChecks((previous) => ({
                      ...previous,
                      pendingShipment: event.target.checked,
                    }))
                  }
                />
                <span>Pending Shipment</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={shipmentChecks.approvedShipment}
                  onChange={(event) =>
                    setShipmentChecks((previous) => ({
                      ...previous,
                      approvedShipment: event.target.checked,
                    }))
                  }
                />
                <span>Approved Shipment</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={shipmentChecks.rejectedShipment}
                  onChange={(event) =>
                    setShipmentChecks((previous) => ({
                      ...previous,
                      rejectedShipment: event.target.checked,
                    }))
                  }
                />
                <span>Rejected Shipment</span>
              </label>
            </div>
          </div>
        )}

        {showStatusTimelineFilter && selectedStatus === "DELIVERED" && !loading && !error && (
          <div
            style={{
              border: "1px solid #dce9e2",
              borderRadius: "12px",
              backgroundColor: "#f8fcfa",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "#165d46", marginBottom: "10px" }}>
              Delivery Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={deliveryChecks.all}
                  onChange={(event) => {
                    const isChecked = event.target.checked;
                    setDeliveryChecks({
                      all: isChecked,
                      deliveryCompleted: isChecked,
                      deliveryFailed: isChecked,
                    });
                  }}
                />
                <span>All</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={deliveryChecks.deliveryCompleted}
                  onChange={(event) => {
                    const nextDeliveryCompleted = event.target.checked;
                    setDeliveryChecks((previous) => ({
                      ...previous,
                      deliveryCompleted: nextDeliveryCompleted,
                      all: nextDeliveryCompleted && previous.deliveryFailed,
                    }));
                  }}
                />
                <span>Delivery Completed</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={deliveryChecks.deliveryFailed}
                  onChange={(event) => {
                    const nextDeliveryFailed = event.target.checked;
                    setDeliveryChecks((previous) => ({
                      ...previous,
                      deliveryFailed: nextDeliveryFailed,
                      all: previous.deliveryCompleted && nextDeliveryFailed,
                    }));
                  }}
                />
                <span>Delivery Failed</span>
              </label>
            </div>
          </div>
        )}

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

        {!loading && !error && orders.length > 0 && visibleOrders.length === 0 && (
          <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
            No orders found for the selected status.
          </Typography>
        )}

        {!loading && !error && visibleOrders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "0.5em" }}>
            {visibleOrders.map((order) => {
              const totalItems = (order.products || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
              const normalizedShipmentStatus = (
                order?.shipmentStatus ||
                order?.shipmentApprovalStatus ||
                order?.shipmentDecision ||
                ""
              )
                .toUpperCase()
                .trim();
              const normalizedOrderStatus = (order?.orderStatus || "").toUpperCase().trim();
              const isShipmentPending =
                ["PENDING", "SHIPMENT_PENDING", "PENDING_SHIPMENT"].includes(normalizedShipmentStatus) ||
                (!normalizedShipmentStatus && normalizedOrderStatus === "APPROVED");
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
                      <Chip
                        label={order.paymentStatus || "UNKNOWN"}
                        size="small"
                        style={{
                          backgroundColor: ["PAID", "SUCCESS"].includes((order.paymentStatus || "").toUpperCase())
                            ? "#e8f5e9"
                            : "#fff3e0",
                          color: ["PAID", "SUCCESS"].includes((order.paymentStatus || "").toUpperCase())
                            ? "#2e7d32"
                            : "#e65100",
                          border: `1px solid ${
                            ["PAID", "SUCCESS"].includes((order.paymentStatus || "").toUpperCase())
                              ? "#a5d6a7"
                              : "#ffcc80"
                          }`,
                          fontWeight: 600,
                        }}
                      />
                      {isShipmentPending && (
                        <Chip
                          label="Shipment Pending"
                          size="small"
                          style={{
                            backgroundColor: "#fff8e1",
                            color: "#8d6e63",
                            border: "1px solid #ffe082",
                            fontWeight: 600,
                          }}
                        />
                      )}
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
