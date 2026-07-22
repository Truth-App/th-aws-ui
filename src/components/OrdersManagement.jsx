import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { fetchAuthSession } from "aws-amplify/auth";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  MdAllInbox,
  MdShoppingCart,
  MdPayments,
  MdFactCheck,
  MdLocalShipping,
  MdInventory,
  MdSearch,
} from "react-icons/md";
import { getMyOrders, getOrders } from "../api/orders";

const TIMELINE_FILTER_STEPS = ["PLACED", "PAID", "SHIPPED", "DELIVERED"];
const TIMELINE_STEP_LABELS = {
  PLACED: "Placed",
  PAID: "Approval",
  ACCEPTED: "Accepted",
  SHIPPED: "Shipment",
  DELIVERED: "Delivered",
};

const DEFAULT_APPROVAL_CHECKS = {
  pendingApproval: true,
  approved: false,
  rejected: false,
  guestOrder: false,
};

const DEFAULT_SHIPMENT_CHECKS = {
  pendingShipment: true,
  approvedShipment: false,
  rejectedShipment: false,
};

const DEFAULT_DELIVERY_CHECKS = {
  pendingDelivery: true,
  deliveryCompleted: false,
  deliveryFailed: false,
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
  if (["DELIVERED", "PAID", "SUCCESS"].includes(normalized)) return "var(--brand-primary-strong)";
  if (["SHIPPED", "ACCEPTED", "PLACED"].includes(normalized)) return "#ed6c02";
  return "#555";
};

const isCODOrder = (order) => {
  const normalizedPaymentStatus = (order?.paymentStatus || "").toUpperCase().trim();
  const normalizedPaymentMode = (
    order?.paymentMode ||
    order?.paymentMethod ||
    order?.paymentType ||
    ""
  )
    .toUpperCase()
    .trim();
  const codFlagValue = String(order?.isPaymentCOD || "").toLowerCase().trim();

  return normalizedPaymentStatus === "COD" || normalizedPaymentMode === "COD" || codFlagValue === "true";
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
  ordersApi = "my-orders",
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [approvalChecks, setApprovalChecks] = useState(DEFAULT_APPROVAL_CHECKS);
  const [shipmentChecks, setShipmentChecks] = useState(DEFAULT_SHIPMENT_CHECKS);
  const [deliveryChecks, setDeliveryChecks] = useState(DEFAULT_DELIVERY_CHECKS);
  const [orderIdSearchTerm, setOrderIdSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleTimelineStatusSelect = (step) => {
    setSelectedStatus(step);
    setApprovalChecks(DEFAULT_APPROVAL_CHECKS);
    setShipmentChecks(DEFAULT_SHIPMENT_CHECKS);
    setDeliveryChecks(DEFAULT_DELIVERY_CHECKS);
  };

  useEffect(() => {
    const restoredState = location.state?.restoreOrdersState;

    if (!restoredState) return;

    setSelectedStatus(restoredState.selectedStatus || "ALL");
    setApprovalChecks(restoredState.approvalChecks || DEFAULT_APPROVAL_CHECKS);
    setShipmentChecks(restoredState.shipmentChecks || DEFAULT_SHIPMENT_CHECKS);
    setDeliveryChecks({ ...DEFAULT_DELIVERY_CHECKS, ...(restoredState.deliveryChecks || {}) });
    setOrderIdSearchTerm(restoredState.orderIdSearchTerm || "");
  }, [location.state]);

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

        const fetchOrders = ordersApi === "orders" ? getOrders : getMyOrders;
        const data = await fetchOrders(accessToken);
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
  }, [ordersApi]);

  const visibleOrders = orders.filter((order) => {
    const normalizedSearchTerm = orderIdSearchTerm.trim().toLowerCase();
    const fullOrderId = String(order?.orderId || "").toLowerCase();
    const shortOrderId = String(order?.orderId || "").slice(0, 8).toLowerCase();
    const orderPincodeCandidates = [
      order?.pincode,
      order?.pinCode,
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
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => String(value).toLowerCase());

    const orderPhoneCandidates = [
      order?.phone,
      order?.mobile,
      order?.user?.phone,
      order?.user?.mobile,
      order?.shippingAddress?.phone,
      order?.deliveryAddress?.phone,
      order?.address?.phone,
      order?.customerAddress?.phone,
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => String(value).toLowerCase());

    const matchesOrderId = fullOrderId.includes(normalizedSearchTerm) || shortOrderId.includes(normalizedSearchTerm);
    const matchesPincode = orderPincodeCandidates.some((pincode) => pincode.includes(normalizedSearchTerm));
    const matchesPhone = orderPhoneCandidates.some((phone) => phone.includes(normalizedSearchTerm));

    if (normalizedSearchTerm && !matchesOrderId && !matchesPincode && !matchesPhone) {
      return false;
    }

    if (selectedStatus === "ALL") return true;

    const normalizedOrderStatus = (order?.orderStatus || "").toUpperCase();
    const normalizedPaymentStatus = (order?.paymentStatus || "").toUpperCase();

    if (selectedStatus === "PLACED") {
      const isPaymentCOD = isCODOrder(order);
      const normalizedPaymentMode = (order.paymentMode || order.paymentMethod || order.paymentType || "").toUpperCase().trim();
      return normalizedOrderStatus === "PLACED" && (normalizedPaymentStatus === "PAYMENT_PENDING" || normalizedPaymentStatus === "PAYMENT_MANUALLY_APPROVED" || normalizedPaymentMode === "PAYMENT_PENDING" || normalizedPaymentMode === "PAYMENT_MANUALLY_APPROVED") && !isPaymentCOD;
    }

    if (selectedStatus === "PAID") {
      const isPaymentCOD = isCODOrder(order);
      const matchesPendingApproval =
        approvalChecks.pendingApproval &&
        (
          (normalizedOrderStatus === "PLACED" && normalizedPaymentStatus === "PAID") ||
          (normalizedOrderStatus === "PLACED" && isPaymentCOD)
        );
      const matchesApproved = approvalChecks.approved && normalizedOrderStatus === "ORDER_APPROVED";
      const matchesRejected = approvalChecks.rejected && normalizedOrderStatus === "ORDER_REJECTED";
      const matchesGuestOrder = approvalChecks.guestOrder && order?.isGuestOrder === true;

      return matchesPendingApproval || matchesApproved || matchesRejected || matchesGuestOrder;
    }

    if (selectedStatus === "SHIPPED") {
      const matchesPendingShipment =
        shipmentChecks.pendingShipment &&
        normalizedOrderStatus === "ORDER_APPROVED";

      const matchesApprovedShipment =
        shipmentChecks.approvedShipment &&
        normalizedOrderStatus === "SHIPMENT_APPROVED";

      const matchesRejectedShipment =
        shipmentChecks.rejectedShipment &&
        normalizedOrderStatus === "SHIPMENT_REJECTED";

      return matchesPendingShipment || matchesApprovedShipment || matchesRejectedShipment;
    }

    if (selectedStatus === "DELIVERED") {
      const matchesPendingDelivery =
        deliveryChecks.pendingDelivery && normalizedOrderStatus === "SHIPMENT_APPROVED";
      const matchesCompleted =
        deliveryChecks.deliveryCompleted && normalizedOrderStatus === "DELIVERY_COMPLETED";
      const matchesFailed =
        deliveryChecks.deliveryFailed &&
        (normalizedOrderStatus === "DELIVERY_REJECTED" || normalizedOrderStatus === "DELIVERY_FAILED");

      return matchesPendingDelivery || matchesCompleted || matchesFailed;
    }

    return false;
  });

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: "1px solid var(--brand-border)",
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
            <Typography variant="h6" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </div>
        </div>

        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by order id, pincode, or phone number"
            value={orderIdSearchTerm}
            onChange={(event) => setOrderIdSearchTerm(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={18} color="var(--brand-primary-strong)" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: isMobile ? "100%" : "420px",
              maxWidth: "100%",
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#ffffff",
              },
            }}
          />
        </div>

        {showStatusTimelineFilter && !loading && !error && (
          <div
            style={{
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              backgroundColor: "var(--brand-surface)",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "var(--brand-primary)", marginBottom: "10px" }}>
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
                        onClick={() => handleTimelineStatusSelect(step)}
                        style={{
                          textTransform: "none",
                          borderRadius: "999px",
                          fontWeight: 700,
                          borderColor: "var(--brand-primary)",
                          color: isSelected ? "#fff" : "var(--brand-primary)",
                          backgroundColor: isSelected ? "var(--brand-primary)" : "#fff",
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
                        <div style={{ width: "20px", height: "2px", backgroundColor: "var(--brand-divider)", margin: "0 4px" }} />
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
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              backgroundColor: "var(--brand-surface)",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "var(--brand-primary)", marginBottom: "10px" }}>
              Approval Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={approvalChecks.pendingApproval}
                    onChange={(event) => setApprovalChecks((prev) => ({ ...prev, pendingApproval: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Pending Approval</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={approvalChecks.approved}
                    onChange={(event) => setApprovalChecks((prev) => ({ ...prev, approved: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Approved order</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={approvalChecks.rejected}
                    onChange={(event) => setApprovalChecks((prev) => ({ ...prev, rejected: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Rejected order</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={approvalChecks.guestOrder}
                    onChange={(event) => setApprovalChecks((prev) => ({ ...prev, guestOrder: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Guest Order</Typography>}
              />
            </div>
          </div>
        )}

        {showStatusTimelineFilter && selectedStatus === "DELIVERED" && !loading && !error && (
          <div
            style={{
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              backgroundColor: "var(--brand-surface)",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "var(--brand-primary)", marginBottom: "10px" }}>
              Delivery Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deliveryChecks.pendingDelivery}
                    onChange={(event) => setDeliveryChecks((prev) => ({ ...prev, pendingDelivery: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Pending Delivery</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deliveryChecks.deliveryCompleted}
                    onChange={(event) => setDeliveryChecks((prev) => ({ ...prev, deliveryCompleted: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Completed Delivery</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deliveryChecks.deliveryFailed}
                    onChange={(event) => setDeliveryChecks((prev) => ({ ...prev, deliveryFailed: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Failed Delivery</Typography>}
              />
            </div>
          </div>
        )}

        {showStatusTimelineFilter && selectedStatus === "SHIPPED" && !loading && !error && (
          <div
            style={{
              border: "1px solid var(--brand-border)",
              borderRadius: "12px",
              backgroundColor: "var(--brand-surface)",
              padding: isMobile ? "10px" : "12px",
              marginBottom: "12px",
            }}
          >
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: "var(--brand-primary)", marginBottom: "10px" }}>
              Shipment Status Filter
            </Typography>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shipmentChecks.pendingShipment}
                    onChange={(event) => setShipmentChecks((prev) => ({ ...prev, pendingShipment: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Pending Shipment</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shipmentChecks.approvedShipment}
                    onChange={(event) => setShipmentChecks((prev) => ({ ...prev, approvedShipment: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Approved Shipment</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shipmentChecks.rejectedShipment}
                    onChange={(event) => setShipmentChecks((prev) => ({ ...prev, rejectedShipment: event.target.checked }))}
                    sx={{ color: "var(--brand-primary)", "&.Mui-checked": { color: "var(--brand-primary)" }, padding: "4px" }}
                  />
                }
                label={<Typography variant="body2" style={{ fontWeight: 500, color: "var(--brand-ink)" }}>Rejected Shipment</Typography>}
              />
            </div>
          </div>
        )}


        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "1em" }}>
            <CircularProgress size={22} style={{ color: "var(--brand-primary)" }} />
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
              const isShipmentPending =
                ["PENDING", "SHIPMENT_PENDING", "PENDING_SHIPMENT"].includes(normalizedShipmentStatus);
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
                      {(() => {
                        const normalizedPaymentStatus = (order.paymentStatus || "").toUpperCase().trim();
                        const normalizedPaymentMode = (order.paymentMode || order.paymentMethod || order.paymentType || "").toUpperCase().trim();
                        const isPaymentCOD = isCODOrder(order);
                        const paymentLabel = isPaymentCOD
                          ? "Cash on Delivery"
                          : normalizedPaymentStatus === "PAYMENT_PENDING" || normalizedPaymentMode === "PAYMENT_PENDING"
                            ? "Payment Pending"
                            : normalizedPaymentStatus === "PAYMENT_MANUALLY_APPROVED" || normalizedPaymentMode === "PAYMENT_MANUALLY_APPROVED"
                              ? "Payment Manually Approved"
                              : (order.paymentStatus || order.paymentMode || "UNKNOWN");
                        const isPaymentSuccess = ["PAID", "SUCCESS"].includes(normalizedPaymentStatus) || ["PAID", "SUCCESS"].includes(normalizedPaymentMode) || isPaymentCOD;

                        return (
                          <>
                      <Chip
                        label={order.orderStatus || "UNKNOWN"}
                        size="small"
                        style={{
                          backgroundColor: "var(--brand-surface)",
                          color: statusColor(order.orderStatus),
                          border: "1px solid var(--brand-border)",
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={paymentLabel}
                        size="small"
                        style={{
                          backgroundColor: isPaymentSuccess
                            ? "var(--brand-tint)"
                            : "#fff3e0",
                          color: isPaymentSuccess
                            ? "var(--brand-primary-strong)"
                            : "#e65100",
                          border: `1px solid ${
                            isPaymentSuccess
                              ? "var(--brand-tint-border)"
                              : "#ffcc80"
                          }`,
                          fontWeight: 600,
                        }}
                      />
                          </>
                        );
                      })()}
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
                        onClick={() => {
                          const ordersState = {
                            selectedStatus,
                            approvalChecks,
                            shipmentChecks,
                            deliveryChecks,
                            orderIdSearchTerm,
                          };

                          navigate(`/order?orderId=${encodeURIComponent(order.orderId)}`, {
                            state: {
                              showBackButton: true,
                              source: "orders",
                              sourcePath: location.pathname,
                              restoreOrdersState: ordersState,
                            },
                          });
                        }}
                        style={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          borderColor: "var(--brand-primary)",
                          color: "var(--brand-primary)",
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
