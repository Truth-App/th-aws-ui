import Navbar from "../components/Navbar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { MdArrowBack, MdCheckCircle } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import {
  getOrderById,
  updateOrderApproval,
  updateOrderShipment,
  updateOrderDelivery,
  getProductStock,
  getInvoiceByOrderId,
} from "../api/orders";
import { getUsers } from "../api/users";
import { fetchUsers } from "../store/slices/usersSlice";
import { getUserRoleFromList } from "../constants/dashboardFeatures";
import { ADMIN_ROLE, SUPER_STOCKIST_ROLE } from "../constants/roles";

const IMAGE_BASE_URL = "https://th-app-product.s3.ap-south-2.amazonaws.com/";
const TIMELINE_STEPS = ["PLACED", "PAID", "ACCEPTED", "SHIPPED", "DELIVERED"];
const TIMELINE_STEP_LABELS = {
  PLACED: "Order Placed",
  PAID: "Payment status",
  ACCEPTED: "Order accepted",
  SHIPPED: "Order shipped",
  DELIVERED: "Delivered",
};

const getProductImageUrl = (product) => {
  if (!product?.imageKeys?.length) return "/thriftyhomelogo.png";
  return `${IMAGE_BASE_URL}${product.imageKeys[0]}`;
};

const getOrderProductId = (product) =>
  String(product?.id || product?.productId || product?._id || product?.inventoryId || "").trim();

const mapStockResponseByProductId = (stockResponse) => {
  const rows = Array.isArray(stockResponse?.stock)
    ? stockResponse.stock
    : Array.isArray(stockResponse)
      ? stockResponse
      : [];

  return rows.reduce((acc, row) => {
    const productId = String(row?.id || row?.productId || row?._id || row?.inventoryId || "").trim();
    if (!productId) return acc;

    acc[productId] = {
      ...row,
      availableStock: row?.availableStock ?? row?.availableQuantity ?? row?.stock ?? 0,
    };

    return acc;
  }, {});
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
  const isPaymentCOD = normalizedPaymentStatus === "COD" || details?.isPaymentCOD === true;
  const normalizedAdminApprovalStatus = (details?.adminApprovalStatus || "").toUpperCase();
  const normalizedShipmentStatus = (
    details?.shipmentStatus ||
    details?.shipmentApprovalStatus ||
    details?.shipmentDecision ||
    ""
  )
    .toUpperCase()
    .trim();
  const normalizedDeliveryApprovalStatus = (
    details?.deliveryApprovalStatus ||
    details?.deliveryStatus ||
    details?.deliveryDecision ||
    ""
  )
    .toUpperCase()
    .trim();
  const isApprovedStatus = ["ORDER_APPROVED", "APPROVED"].includes(normalizedAdminApprovalStatus);
  const isShipmentApproved = ["SHIPMENT_APPROVED", "APPROVED"].includes(normalizedShipmentStatus);
  const isShipmentRejected = ["SHIPMENT_REJECTED", "REJECTED"].includes(normalizedShipmentStatus);
  const isDeliveryCompleted = ["DELIVERY_COMPLETED", "DELIVERED"].includes(normalizedDeliveryApprovalStatus);
  const isDeliveryFailed = ["FAILED", "NOT_DELIVERED", "DELIVERY_FAILED"].includes(normalizedDeliveryApprovalStatus);
  const isOrderApprovedStatus = ["ORDER_APPROVED", "ACCEPTED"].includes(normalizedOrderStatus);

  if (normalizedOrderStatus === "DELIVERED" || isDeliveryCompleted || isDeliveryFailed) return 4;
  if (normalizedOrderStatus === "SHIPPED" || isShipmentApproved || isShipmentRejected) return 3;
  if (isOrderApprovedStatus) return 2;
  if (isApprovedStatus) return 2;
  if (normalizedPaymentStatus === "PAID" || isPaymentCOD) return 1;
  return 0;
};

const getTimelineStepTimes = (details) => {
  const orderHistory = details?.orderHistory || [];
  const paymentHistory = details?.paymentHistory || [];
  const normalizedOrderStatus = (details?.orderStatus || "").toUpperCase();
  const normalizedAdminApprovalStatus = (details?.adminApprovalStatus || "").toUpperCase();
  const normalizedDeliveryApprovalStatus = (
    details?.deliveryApprovalStatus ||
    details?.deliveryStatus ||
    details?.deliveryDecision ||
    ""
  )
    .toUpperCase()
    .trim();
  const adminApprovalDate = details?.adminApprovalDetails?.approvedDate || "";
  const shipmentApprovedDate =
    details?.shipmentApprovalDetails?.approvedDate ||
    details?.shipmentDetails?.approvedDate ||
    "";
  const deliveryApprovedDate = details?.deliveryApprovalDetails?.approvedDate || details?.deliveryDetails?.approvedDate || "";
  const deliveryCompletedDate =
    details?.deliveryApprovalDetails?.deliveredDate ||
    details?.deliveryDetails?.deliveredDate ||
    details?.deliveredDate ||
    "";
  const isFinalApprovalStatus = ["ORDER_APPROVED", "APPROVED", "REJECTED"].includes(normalizedAdminApprovalStatus);
  const isOrderApprovedStatus = ["ORDER_APPROVED", "ACCEPTED"].includes(normalizedOrderStatus);
  const isDeliveryCompleted = ["DELIVERY_COMPLETED", "DELIVERED"].includes(normalizedDeliveryApprovalStatus);
  const isDeliveryFailed = ["FAILED", "NOT_DELIVERED", "DELIVERY_FAILED"].includes(normalizedDeliveryApprovalStatus);

  return {
    PLACED: getHistoryTimestamp(orderHistory, "PLACED") || details?.createdAt || "",
    PAID: getHistoryTimestamp(paymentHistory, "PAID") || "",
    ACCEPTED:
      getHistoryTimestamp(orderHistory, "ACCEPTED") ||
      (isFinalApprovalStatus || isOrderApprovedStatus ? adminApprovalDate : ""),
    SHIPPED: getHistoryTimestamp(orderHistory, "SHIPPED") || shipmentApprovedDate,
    DELIVERED:
      getHistoryTimestamp(orderHistory, "DELIVERED") ||
      ((isDeliveryCompleted || isDeliveryFailed) ? deliveryCompletedDate || deliveryApprovedDate : ""),
  };
};

const OrderSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.user.user);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [shipmentComment, setShipmentComment] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState("");
  const [shipmentMessage, setShipmentMessage] = useState("");
  const [deliveryStatusChoice, setDeliveryStatusChoice] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [deliveryPinInput, setDeliveryPinInput] = useState("");
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [stakeholderOverride, setStakeholderOverride] = useState("");
  const [stakeholderOptions, setStakeholderOptions] = useState([]);
  const [stakeholderLoading, setStakeholderLoading] = useState(false);
  const [stakeholderError, setStakeholderError] = useState("");
  const [productStock, setProductStock] = useState({});
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const details = orderData?.orderDetails;
  const hasSStockistAssigned = Boolean(String(details?.sStockistId || "").trim());

  // Razorpay locks document.body scroll when its modal opens.
  // If React navigates away before Razorpay restores it, the page is unscrollable.
  // This effect guarantees scroll is always re-enabled when this page mounts.
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate expected delivery date from order details */
  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    if (usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersStatus]);

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

  useEffect(() => {
    const rawExpectedDate =
      details?.shipmentApprovalDetails?.expectedDeliveryDate ||
      details?.shipmentDetails?.expectedDeliveryDate ||
      details?.expectedDeliveryDate ||
      "";

    if (!rawExpectedDate) {
      setExpectedDeliveryDate("");
      return;
    }

    const date = new Date(rawExpectedDate);
    if (Number.isNaN(date.getTime())) {
      setExpectedDeliveryDate("");
      return;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setExpectedDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, [details]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- reset/fetch super stockist options for admin assignment */
  useEffect(() => {
    const currentUserRole = getUserRoleFromList(users, authUser?.email);
    const isCurrentUserAdmin = currentUserRole === ADMIN_ROLE;
    const shouldFetchStakeholders = isCurrentUserAdmin;

    if (!shouldFetchStakeholders) {
      setStakeholderOptions([]);
      setStakeholderError("");
      setStakeholderOverride("");
      return;
    }

    let ignore = false;

    const fetchStakeholders = async () => {
      setStakeholderLoading(true);
      setStakeholderError("");

      try {
        const response = await getUsers();
        const filteredUsers = Array.isArray(response)
          ? response.filter((user) => {
              const role = (user?.role || "").trim();
              return role === SUPER_STOCKIST_ROLE;
            })
          : [];

        if (!ignore) {
          setStakeholderOptions(filteredUsers);
        }
      } catch (error) {
        if (!ignore) {
          setStakeholderOptions([]);
          setStakeholderError(error?.message || "Failed to fetch stakeholders.");
        }
      } finally {
        if (!ignore) {
          setStakeholderLoading(false);
        }
      }
    };

    fetchStakeholders();

    return () => {
      ignore = true;
    };
  }, [users, authUser?.email]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate delivery form fields from order details */
  useEffect(() => {
    const rawDeliveryStatus = (
      details?.deliveryApprovalStatus ||
      details?.deliveryStatus ||
      details?.deliveryDecision ||
      ""
    )
      .toUpperCase()
      .trim();

    if (["DELIVERY_COMPLETED", "DELIVERED"].includes(rawDeliveryStatus)) {
      setDeliveryStatusChoice("DELIVERED");
    } else if (["NOT_DELIVERED", "FAILED", "DELIVERY_FAILED"].includes(rawDeliveryStatus)) {
      setDeliveryStatusChoice("NOT_DELIVERED");
    } else {
      setDeliveryStatusChoice("");
    }

    const rawDeliveryComment =
      details?.deliveryApprovalDetails?.comments ||
      details?.deliveryDetails?.comments ||
      details?.deliveryComment ||
      "";
    setDeliveryComment(rawDeliveryComment);

    const rawDeliveredDate =
      details?.deliveryApprovalDetails?.deliveredDate ||
      details?.deliveryDetails?.deliveredDate ||
      details?.deliveredDate ||
      "";
    const rawDeliveryPin =
      details?.deliveryApprovalDetails?.customerDeliveryPin ||
      details?.deliveryDetails?.customerDeliveryPin ||
      details?.customerDeliveryPin ||
      "";
    const rawDeliveryPaymentMethod =
      details?.deliveryApprovalDetails?.paymentMethod ||
      details?.deliveryDetails?.paymentMethod ||
      details?.paymentMethod ||
      details?.paymentMode ||
      details?.paymentType ||
      "";
    const normalizedDeliveryPin = String(rawDeliveryPin).replace(/\D/g, "").slice(0, 4);
    const normalizedDeliveryPaymentMethod = String(rawDeliveryPaymentMethod || "").toUpperCase().trim();
    // Don't pre-populate delivery pin value for Super Stockist
    const shouldPrePopulatePin = !isSuperStockist;
    setDeliveryPinInput(shouldPrePopulatePin ? normalizedDeliveryPin : "");
    setDeliveryPaymentMethod(["UPI", "CASH"].includes(normalizedDeliveryPaymentMethod) ? normalizedDeliveryPaymentMethod : "");

    if (!rawDeliveredDate) {
      setDeliveredDate("");
      return;
    }

    const date = new Date(rawDeliveredDate);
    if (Number.isNaN(date.getTime())) {
      setDeliveredDate("");
      return;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setDeliveredDate(`${yyyy}-${mm}-${dd}`);
  }, [details]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const adminApprovalStatus = (details?.adminApprovalStatus || "").toUpperCase();
  const normalizedOrderStatus = (details?.orderStatus || "").toUpperCase();
  const userRole = getUserRoleFromList(users, authUser?.email);
  const isAdmin = userRole === ADMIN_ROLE;
  const isCustomer = userRole === "Customer";
  const isSuperStockist = userRole === SUPER_STOCKIST_ROLE;
  const isStockist = userRole === "Stockist";
  const isDealer = userRole === "Dealer";
  const isRoleUndefined = !String(userRole || "").trim();
  const canManageShipment = isAdmin || isSuperStockist;
  const isAdminApproved =
    details?.isAdminApproved === true ||
    String(details?.isAdminApproved || "")
      .toLowerCase()
      .trim() === "true";
  const isAdminApprovalApproved =
    isAdminApproved ||
    ["ORDER_APPROVED", "APPROVED"].includes(adminApprovalStatus) ||
    ["ORDER_APPROVED", "ACCEPTED"].includes(normalizedOrderStatus);
  const hasFinalAdminApproval = isAdminApprovalApproved || adminApprovalStatus === "REJECTED";
  const adminApprovalDetails = details?.adminApprovalDetails || {};
  const shipmentStatus = (
    details?.shipmentStatus ||
    details?.shipmentApprovalStatus ||
    details?.shipmentDecision ||
    "PENDING"
  )
    .toUpperCase()
    .trim();
  const isShipmentApproved = ["SHIPMENT_APPROVED", "APPROVED"].includes(shipmentStatus);
  const isShipmentRejected = ["SHIPMENT_REJECTED", "REJECTED"].includes(shipmentStatus);
  const hasFinalShipmentDecision = isShipmentApproved || isShipmentRejected;
  const shipmentDetails = details?.shipmentApprovalDetails || details?.shipmentDetails || {};
  const deliveryPin =
    details?.customerDeliveryPin ||
    details?.shippingAddress?.pincode ||
    details?.deliveryAddress?.pincode ||
    details?.pincode ||
    "";
  const normalizedAuthEmail = String(authUser?.email || "").trim().toLowerCase();
  const normalizedOrderCustomerEmail = String(details?.user?.email || details?.email || "")
    .trim()
    .toLowerCase();
  const currentUserIds = [authUser?.id, authUser?.userId, authUser?.sub]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const orderCustomerIds = [details?.userId, details?.customerId, details?.user?.userId, details?.user?.id]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const isOrderPlacedByCurrentUser =
    (Boolean(normalizedAuthEmail) && normalizedAuthEmail === normalizedOrderCustomerEmail) ||
    currentUserIds.some((value) => orderCustomerIds.includes(value));
  const shouldShowDeliveryPinInput = !(isStockist || isDealer);
  const isRoleUnknownOrNotMatched =
    isRoleUndefined || ![ADMIN_ROLE, SUPER_STOCKIST_ROLE, "Stockist", "Dealer", "Customer"].includes(userRole);
  const canShowDeliveryPinChip =
    isShipmentApproved &&
    Boolean(String(deliveryPin || "").trim()) &&
    !(isStockist || isDealer) &&
    (isAdmin || (isCustomer && isOrderPlacedByCurrentUser) || isRoleUnknownOrNotMatched);
  const isOrderApprovedForOps = normalizedOrderStatus === "ORDER_APPROVED";
  const hasShipmentApprovalPayload =
    Boolean((details?.shipmentApprovalStatus || "").trim()) ||
    Boolean(details?.shipmentApprovalDetails);
  const canShowShipmentCard = isOrderApprovedForOps || hasShipmentApprovalPayload;
  const canShowDeliveryCard = isShipmentApproved;
  const isPaymentCOD =
    (details?.paymentStatus || "").toUpperCase() === "COD" || details?.isPaymentCOD === true;
  const isPaymentPaidOnline = (details?.paymentStatus || "").toUpperCase() === "PAID";
  const isCodPaymentSelectionRequired = isPaymentCOD && deliveryStatusChoice === "DELIVERED";
  const isDeliveryUpdateDisabled =
    deliveryLoading ||
    !deliveryStatusChoice ||
    (deliveryStatusChoice === "DELIVERED" && (
      !deliveredDate ||
      (shouldShowDeliveryPinInput && deliveryPinInput.length !== 4) ||
      (isCodPaymentSelectionRequired && !deliveryPaymentMethod)
    ));
  const normalizedDeliveryApprovalStatus = (
    details?.deliveryApprovalStatus ||
    details?.deliveryStatus ||
    details?.deliveryDecision ||
    ""
  )
    .toUpperCase()
    .trim();
  const isDeliveryCompleted = ["DELIVERY_COMPLETED", "DELIVERED"].includes(normalizedDeliveryApprovalStatus);
  const isDeliveryFailed = ["FAILED", "NOT_DELIVERED", "DELIVERY_FAILED"].includes(normalizedDeliveryApprovalStatus);
  const hasFinalDeliveryDecision = isDeliveryCompleted || isDeliveryFailed;
  const deliveryDetails = details?.deliveryApprovalDetails || details?.deliveryDetails || {};
  const products = details?.products || [];
  const selectedStakeholderUser = stakeholderOptions.find((user) => {
    const candidateId = user?.userId || user?.id || user?.email || "";
    return candidateId === stakeholderOverride;
  });
  const selectedStakeholderRoleForApproval =
    selectedStakeholderUser?.role === SUPER_STOCKIST_ROLE ? "sStockist" : "";
  const selectedSStockistId =
    selectedStakeholderRoleForApproval === "sStockist" ? String(stakeholderOverride || "").trim() : "";
  const resolvedSStockistId = String(selectedSStockistId || details?.sStockistId || "").trim();
  const currentSStockistId = String(details?.sStockistId || "").trim();
  const shouldIncludeStakeholderUpdate =
    Boolean(stakeholderOverride && selectedStakeholderRoleForApproval);
  const currentTimelineIndex = getTimelineIndex(details);
  const timelineStepTimes = getTimelineStepTimes(details);
  const totalAmount = products.reduce((sum, item) => sum + (item.subTotal || (item.price || 0) * (item.quantity || 0)), 0);
  const totalMrp = products.reduce((sum, item) => sum + (item.mrpPrice || 0) * (item.quantity || 0), 0);
  const totalSaved = totalMrp - totalAmount;
  const savedPercentage = totalMrp > 0 ? (totalSaved / totalMrp) * 100 : 0;
  const isShipmentCardEditable = canManageShipment && canShowShipmentCard && !hasFinalShipmentDecision;

  /* eslint-disable react-hooks/set-state-in-effect -- fetch and reset stock when shipment card edit mode toggles */
  useEffect(() => {
    if (!isShipmentCardEditable) {
      setProductStock({});
      return;
    }

    const productIds = (details?.products || []).map((product) => getOrderProductId(product)).filter(Boolean);

    if (!productIds.length) {
      setProductStock({});
      return;
    }

    const fetchStock = async () => {
      try {
        const stockData = await getProductStock(orderId);
        setProductStock(mapStockResponseByProductId(stockData));
      } catch {
        setProductStock({});
      }
    };

    fetchStock();
  }, [isShipmentCardEditable, details?.products, resolvedSStockistId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/orders");
  };

  const handleApproval = async (nextApprovalStatus) => {
    if (!orderId) return;

    const trimmedComment = approvalComment.trim();
    setApprovalLoading(true);
    setApprovalError("");
    setApprovalMessage("");

    try {
      const approvalPayload = {
        approvalType: "ORDER",
        approvalStatus: nextApprovalStatus,
        ...(trimmedComment ? { comments: trimmedComment } : {}),
        ...(shouldIncludeStakeholderUpdate
          ? {
              updateStakeholder: [
                {
                  userId: stakeholderOverride,
                  role: selectedStakeholderRoleForApproval,
                },
              ],
            }
          : {}),
      };

      await updateOrderApproval(orderId, approvalPayload);

      const refreshedOrder = await getOrderById(orderId);
      setOrderData(refreshedOrder);

      const nextIsApproved = ["ORDER_APPROVED", "APPROVED"].includes(nextApprovalStatus);

      setApprovalMessage(nextIsApproved ? "Order approved successfully." : "Order rejected successfully.");
    } catch (error) {
      setApprovalError(error?.message || "Failed to update approval status.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleShipment = async (nextShipmentStatus) => {
    if (!orderId) return;

    const trimmedComment = shipmentComment.trim();
    setShipmentLoading(true);
    setShipmentError("");
    setShipmentMessage("");

    try {
      const normalizedExpectedDeliveryDate = expectedDeliveryDate
        ? new Date(`${expectedDeliveryDate}T00:00:00.000Z`).toISOString()
        : "";

      const shipmentPayload = {
        approvalType: "SHIPMENT",
        approvalStatus: nextShipmentStatus,
        ...(normalizedExpectedDeliveryDate ? { expectedDeliveryDate: normalizedExpectedDeliveryDate } : {}),
        ...(trimmedComment ? { comments: trimmedComment } : {}),
      };

      await updateOrderShipment(orderId, shipmentPayload);

      const refreshedOrder = await getOrderById(orderId);
      setOrderData(refreshedOrder);

      setShipmentMessage(nextShipmentStatus === "APPROVED" ? "Shipment approved successfully." : "Shipment rejected successfully.");
    } catch (error) {
      setShipmentError(error?.message || "Failed to update shipment status.");
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleDeliveryUpdate = async () => {
    if (!deliveryStatusChoice) {
      setDeliveryError("Please select delivery status.");
      setDeliveryMessage("");
      return;
    }

    if (deliveryStatusChoice === "DELIVERED" && !deliveredDate) {
      setDeliveryError("Please select delivered date.");
      setDeliveryMessage("");
      return;
    }

    if (deliveryStatusChoice === "DELIVERED" && shouldShowDeliveryPinInput && deliveryPinInput.length !== 4) {
      setDeliveryError("Please enter a valid 4-digit delivery pin.");
      setDeliveryMessage("");
      return;
    }

    if (isCodPaymentSelectionRequired && !deliveryPaymentMethod) {
      setDeliveryError("Please select how COD payment was collected.");
      setDeliveryMessage("");
      return;
    }

    const trimmedComment = deliveryComment.trim();
    const deliveryApprovalStatus = deliveryStatusChoice === "DELIVERED" ? "DELIVERED" : "FAILED";
    const normalizedDeliveredDate =
      deliveryStatusChoice === "DELIVERED" && deliveredDate
        ? new Date(`${deliveredDate}T00:00:00.000Z`).toISOString()
        : "";
    const normalizedDeliveryPin =
      deliveryStatusChoice === "DELIVERED" && shouldShowDeliveryPinInput && (isAdmin || isSuperStockist || isCustomer)
        ? String(deliveryPinInput || "").replace(/\D/g, "").slice(0, 4)
        : "";
    const normalizedDeliveryPaymentMethod =
      isCodPaymentSelectionRequired && deliveryPaymentMethod ? deliveryPaymentMethod.toUpperCase().trim() : "";

    setDeliveryLoading(true);
    setDeliveryError("");
    setDeliveryMessage("");

    try {
      const deliveryPayload = {
        approvalType: "DELIVERY",
        approvalStatus: deliveryApprovalStatus,
        ...(trimmedComment ? { comments: trimmedComment } : {}),
        ...(normalizedDeliveredDate ? { deliveredDate: normalizedDeliveredDate } : {}),
        ...(normalizedDeliveryPin ? { inputCustomerDeliveryPin: normalizedDeliveryPin } : {}),
        ...(normalizedDeliveryPaymentMethod ? { paymentMethod: normalizedDeliveryPaymentMethod } : {}),
      };

      await updateOrderDelivery(orderId, deliveryPayload);

      const refreshedOrder = await getOrderById(orderId);
      setOrderData(refreshedOrder);

      setDeliveryMessage("Delivery status updated successfully.");
    } catch {
      setDeliveryError("Failed to update delivery status.");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderId) return;

    setInvoiceLoading(true);
    setInvoiceError("");

    try {
      const response = await getInvoiceByOrderId(orderId);
      const downloadUrl = String(response?.downloadUrl || "").trim();

      if (!downloadUrl) {
        throw new Error("Invoice download URL is not available yet.");
      }

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setInvoiceError(error?.message || "Failed to download invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

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
        <div style={{ width: "100%", maxWidth: "900px" }}>
          <Button
            variant="outlined"
            onClick={handleBackClick}
            startIcon={<MdArrowBack size={18} />}
            style={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              borderColor: "#165d46",
              color: "#165d46",
            }}
          >
            Back
          </Button>
        </div>
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
                      const isApprovalStep = step === "ACCEPTED";
                      const isShipmentStep = step === "SHIPPED";
                      const isDeliveryStep = step === "DELIVERED";
                      const isRejectedAtApprovalStep = isApprovalStep && adminApprovalStatus === "REJECTED";
                      const isRejectedAtShipmentStep = isShipmentStep && isShipmentRejected;
                      const isRejectedAtDeliveryStep = isDeliveryStep && isDeliveryFailed;
                      const isRejectedStep =
                        isRejectedAtApprovalStep || isRejectedAtShipmentStep || isRejectedAtDeliveryStep;
                      const isApprovedAtApprovalStep = isApprovalStep && isAdminApprovalApproved;

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
                              {isRejectedStep && (
                                <Chip
                                  label={
                                    formattedStepTime
                                      ? `${isRejectedAtDeliveryStep ? "Failed" : "Rejected"} · ${formattedStepTime}`
                                      : (isRejectedAtDeliveryStep ? "Failed" : "Rejected")
                                  }
                                  size="small"
                                  style={{
                                    height: "20px",
                                    backgroundColor: "#ffebee",
                                    color: "#c62828",
                                    border: "1px solid #ef9a9a",
                                    fontSize: "0.7rem",
                                  }}
                                />
                              )}
                              {!isRejectedStep && isActive && formattedStepTime && (
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
                              {!isRejectedStep && !isActive && isNextStep && (
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
                              {!isRejectedStep && isApprovedAtApprovalStep && isActive && !formattedStepTime && (
                                <Chip
                                  label="Accepted"
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
                              {!isRejectedStep && step === "PAID" && isActive && isPaymentCOD && !formattedStepTime && (
                                <Chip
                                  label="Cash on Delivery"
                                  size="small"
                                  style={{
                                    height: "20px",
                                    backgroundColor: "#e3f2fd",
                                    color: "#1565c0",
                                    border: "1px solid #90caf9",
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
                    {isAdminApprovalApproved && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px", marginTop: "10px" }}>
                        <Button
                          variant="contained"
                          onClick={handleDownloadInvoice}
                          disabled={invoiceLoading}
                          style={{
                            backgroundColor: "#165d46",
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: "8px",
                          }}
                        >
                          {invoiceLoading ? "Downloading Invoice..." : "Download Invoice"}
                        </Button>
                        {!!invoiceError && (
                          <Typography variant="body2" color="error">
                            {invoiceError}
                          </Typography>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {(
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
                    Admin Approval
                  </Typography>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <Chip
                      label={
                        hasFinalAdminApproval
                          ? isAdminApprovalApproved
                            ? "Approved"
                            : "Rejected"
                          : isAdminApproved
                            ? "Approved"
                            : "Approval Pending"
                      }
                      size="small"
                      style={{
                        backgroundColor: hasFinalAdminApproval
                          ? isAdminApprovalApproved
                            ? "#e8f5e9"
                            : "#ffebee"
                          : isAdminApproved
                            ? "#e8f5e9"
                            : "#fff8e1",
                        color: hasFinalAdminApproval
                          ? isAdminApprovalApproved
                            ? "#2e7d32"
                            : "#c62828"
                          : isAdminApproved
                            ? "#2e7d32"
                            : "#8d6e63",
                        border: `1px solid ${
                          hasFinalAdminApproval
                            ? isAdminApprovalApproved
                              ? "#a5d6a7"
                              : "#ef9a9a"
                            : isAdminApproved
                              ? "#a5d6a7"
                              : "#ffe082"
                        }`,
                        fontWeight: 600,
                      }}
                    />
                    {details?.isGuestOrder === true && (
                      <Chip
                        label="Guest Order"
                        size="small"
                        style={{
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          border: "1px solid #90caf9",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {details?.isStakeholderMatched === true && (
                      <Chip
                        label="Stakeholder Matched"
                        size="small"
                        style={{
                          backgroundColor: "#e8f5e9",
                          color: "#2e7d32",
                          border: "1px solid #a5d6a7",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {!hasFinalAdminApproval && details?.adminApprovalComment && (
                      <Typography variant="body2" color="text.secondary">
                        Last comment: {details.adminApprovalComment}
                      </Typography>
                    )}
                  </div>

                  <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {details?.shippedAdminId && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        style={{ paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }}
                      >
                        Shipped Admin ID = {details.shippedAdminId}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      style={{ fontWeight: 700, color: "#1f1f1f", paddingBottom: "6px", marginBottom: "2px" }}
                    >
                      Superstockist = {details?.sStockistId || "NA"}
                    </Typography>
                    {isAdmin && (
                      <div style={{ paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }}>
                        <FormControl fullWidth size="small" style={{ marginTop: "8px", marginBottom: "8px" }}>
                          <InputLabel>Assign Superstockist</InputLabel>
                          <Select
                            value={stakeholderOverride}
                            label="Assign Superstockist"
                            onChange={(event) => setStakeholderOverride(event.target.value)}
                            disabled={stakeholderLoading || isAdminApprovalApproved}
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 280,
                                  maxWidth: "92vw",
                                },
                              },
                            }}
                          >
                            <MenuItem value="" disabled>
                              {stakeholderLoading ? "Loading superstockists..." : "— Select superstockist —"}
                            </MenuItem>
                            {stakeholderOptions.map((user) => {
                              const firstName = user?.firstName || user?.firstname || "";
                              const lastName = user?.lastName || user?.lastname || "";
                              const fullName = `${firstName} ${lastName}`.trim() || "-";
                              const optionUserId = user?.userId || user?.id || user?.email || "-";
                              const optionPincode = user?.pincode || "-";
                              const isMatched = Boolean(currentSStockistId) && currentSStockistId === optionUserId;
                              return (
                                <MenuItem
                                  key={`${optionUserId}-${user?.role || "-"}`}
                                  value={optionUserId}
                                  style={{ whiteSpace: "normal", wordBreak: "break-word", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                  {isMatched && <MdCheckCircle size={16} color="#2e7d32" />}
                                  {`${fullName} - (${optionUserId}) - (pin - ${optionPincode})`}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        {!!stakeholderError && (
                          <Typography variant="body2" color="error" style={{ marginBottom: "8px" }}>
                            {stakeholderError}
                          </Typography>
                        )}
                      </div>
                    )}
                    {!isAdmin && <div style={{ paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }} />}
                    <Typography
                      variant="body2"
                      style={{ fontWeight: 700, color: "#1f1f1f", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }}
                    >
                      Stockist = {details?.stockistId || "NA"}
                    </Typography>
                    <Typography
                      variant="body2"
                      style={{ fontWeight: 700, color: "#1f1f1f", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }}
                    >
                      Dealer = {details?.dealerId || "NA"}
                    </Typography>
                    <Typography
                      variant="body2"
                      style={{ fontWeight: 700, color: "#1f1f1f", paddingBottom: "6px", marginBottom: "2px", borderBottom: "1px solid #e6e6e6" }}
                    >
                      CustomerId = {details?.userId || details?.user?.userId || "NA"}
                    </Typography>
                  </div>

                  {hasFinalAdminApproval || !isAdmin ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <Typography variant="body2" color="text.secondary">
                        Approved Date = {formatDate(adminApprovalDetails?.approvedDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Comments = {adminApprovalDetails?.comments || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        User ID = {adminApprovalDetails?.userId || "-"}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        label="Comment (Optional)"
                        multiline
                        minRows={2}
                        value={approvalComment}
                        onChange={(event) => setApprovalComment(event.target.value)}
                        placeholder="Add approval/rejection note (optional)"
                      />

                      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          disabled={approvalLoading}
                          onClick={() => handleApproval("APPROVED")}
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "#2e7d32",
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={approvalLoading}
                          onClick={() => handleApproval("REJECTED")}
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "#c62828",
                            color: "#c62828",
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </>
                  )}

                  {approvalLoading && isAdmin && (
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "10px" }}>
                      Updating approval status...
                    </Typography>
                  )}

                  {!!approvalMessage && isAdmin && (
                    <Typography variant="body2" style={{ marginTop: "10px", color: "#2e7d32", fontWeight: 600 }}>
                      {approvalMessage}
                    </Typography>
                  )}

                  {!!approvalError && isAdmin && (
                    <Typography variant="body2" color="error" style={{ marginTop: "10px" }}>
                      {approvalError}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {canManageShipment && isOrderApprovedForOps && (
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
                    Inventory
                  </Typography>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {products.map((product, idx) => {
                      const resolvedProductId = getOrderProductId(product);
                      const quantity = product.quantity || 0;
                      const stockInfo = productStock[resolvedProductId] || {};
                      const availableStock = stockInfo.availableStock ?? stockInfo.availableQuantity ?? stockInfo.stock ?? 0;

                      return (
                        <Card key={`${resolvedProductId || "item"}-${idx}`} variant="outlined" style={{ borderRadius: "10px" }}>
                          <CardContent style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <img
                              src={getProductImageUrl(product)}
                              alt={product.title || "Product image"}
                              style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "8px", backgroundColor: "#f5f5f5" }}
                            />
                            <div style={{ flex: 1, minWidth: "220px" }}>
                              <Typography variant="subtitle2" style={{ fontWeight: 700 }}>
                                {product.title || "-"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" style={{ marginTop: "4px" }}>
                                Order Qty: {quantity}
                              </Typography>
                              <Typography variant="body2" style={{ marginTop: "4px", fontWeight: 600, color: "#165d46" }}>
                                Available Stock: {availableStock}
                              </Typography>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {canShowShipmentCard && (
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
                    Shipment Approval
                  </Typography>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <Chip
                      label={
                        isShipmentApproved
                          ? "Approved Shipment"
                          : isShipmentRejected
                            ? "Rejected Shipment"
                            : "Shipment Pending"
                      }
                      size="small"
                      style={{
                        backgroundColor:
                          isShipmentApproved
                            ? "#e8f5e9"
                            : isShipmentRejected
                              ? "#ffebee"
                              : "#fff8e1",
                        color:
                          isShipmentApproved
                            ? "#2e7d32"
                            : isShipmentRejected
                              ? "#c62828"
                              : "#8d6e63",
                        border: `1px solid ${
                          isShipmentApproved
                            ? "#a5d6a7"
                            : isShipmentRejected
                              ? "#ef9a9a"
                              : "#ffe082"
                        }`,
                        fontWeight: 600,
                      }}
                    />
                    {canShowDeliveryPinChip && (
                      <Chip
                        label={`Delivery Pin - ${deliveryPin}`}
                        size="small"
                        style={{
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          border: "1px solid #90caf9",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </div>

                  {hasFinalShipmentDecision || !canManageShipment ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <Typography variant="body2" color="text.secondary">
                        Expected Delivery Date = {formatDate(shipmentDetails?.expectedDeliveryDate || details?.expectedDeliveryDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved Date = {formatDate(shipmentDetails?.approvedDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Comments = {shipmentDetails?.comments || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email = {shipmentDetails?.email || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        User ID = {shipmentDetails?.userId || "-"}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        type="date"
                        label="Expected Delivery Date"
                        value={expectedDeliveryDate}
                        onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />

                      <TextField
                        fullWidth
                        label="Comment (Optional)"
                        multiline
                        minRows={2}
                        value={shipmentComment}
                        onChange={(event) => setShipmentComment(event.target.value)}
                        placeholder="Add shipment approval/rejection note (optional)"
                        style={{ marginTop: "12px" }}
                      />

                      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          disabled={shipmentLoading}
                          onClick={() => handleShipment("APPROVED")}
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "#2e7d32",
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={shipmentLoading}
                          onClick={() => handleShipment("REJECTED")}
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "#c62828",
                            color: "#c62828",
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </>
                  )}

                  {shipmentLoading && canManageShipment && (
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "10px" }}>
                      Updating shipment status...
                    </Typography>
                  )}

                  {!!shipmentMessage && canManageShipment && (
                    <Typography variant="body2" style={{ marginTop: "10px", color: "#2e7d32", fontWeight: 600 }}>
                      {shipmentMessage}
                    </Typography>
                  )}

                  {!!shipmentError && canManageShipment && (
                    <Typography variant="body2" color="error" style={{ marginTop: "10px" }}>
                      {shipmentError}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {canShowDeliveryCard && (
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
                    Delivery Status
                  </Typography>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <Chip
                      label={
                        isDeliveryCompleted
                          ? "Delivery Completed"
                          : isDeliveryFailed
                            ? "Delivery Failed"
                            : "Delivery Pending"
                      }
                      size="small"
                      style={{
                        backgroundColor:
                          isDeliveryCompleted
                            ? "#e8f5e9"
                            : isDeliveryFailed
                              ? "#ffebee"
                              : "#fff8e1",
                        color:
                          isDeliveryCompleted
                            ? "#2e7d32"
                            : isDeliveryFailed
                              ? "#c62828"
                              : "#8d6e63",
                        border: `1px solid ${
                          isDeliveryCompleted
                            ? "#a5d6a7"
                            : isDeliveryFailed
                              ? "#ef9a9a"
                              : "#ffe082"
                        }`,
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  {hasFinalDeliveryDecision || !canManageShipment ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <Typography variant="body2" color="text.secondary">
                        Approved Date = {formatDate(deliveryDetails?.approvedDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Delivered Date = {formatDate(deliveryDetails?.deliveredDate || details?.deliveredDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Comments = {deliveryDetails?.comments || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email = {deliveryDetails?.email || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        User ID = {deliveryDetails?.userId || "-"}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      <FormControl component="fieldset" style={{ width: "100%" }}>
                        <RadioGroup
                          row
                          value={deliveryStatusChoice}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setDeliveryStatusChoice(nextValue);
                            if (nextValue !== "DELIVERED") {
                              setDeliveredDate("");
                              setDeliveryPinInput("");
                            }
                          }}
                        >
                          <FormControlLabel value="DELIVERED" control={<Radio />} label="Delivered" />
                          <FormControlLabel value="NOT_DELIVERED" control={<Radio />} label="Not Delivered" />
                        </RadioGroup>
                      </FormControl>

                      {deliveryStatusChoice === "DELIVERED" && (
                        <>
                          {shouldShowDeliveryPinInput && (
                            <TextField
                              fullWidth
                              label="Delivery Pin"
                              value={deliveryPinInput}
                              onChange={(event) => setDeliveryPinInput(event.target.value.replace(/\D/g, "").slice(0, 4))}
                              inputProps={{ maxLength: 4, inputMode: "numeric", pattern: "[0-9]*" }}
                              placeholder="Enter 4-digit delivery pin"
                              style={{ marginTop: "12px" }}
                              readOnly={isCustomer || isDealer || isStockist}
                              disabled={isCustomer || isDealer || isStockist}
                            />
                          )}
                          <TextField
                            fullWidth
                            type="date"
                            label="Delivered Date"
                            value={deliveredDate}
                            onChange={(event) => setDeliveredDate(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            style={{ marginTop: shouldShowDeliveryPinInput ? "12px" : "0px" }}
                          />

                          {isPaymentCOD && (
                            <FormControl component="fieldset" style={{ width: "100%", marginTop: "12px" }}>
                              <Typography variant="body2" style={{ fontWeight: 600, color: "#1f1f1f", marginBottom: "8px" }}>
                                Payment *
                              </Typography>
                              <RadioGroup
                                value={deliveryPaymentMethod}
                                onChange={(event) => setDeliveryPaymentMethod(event.target.value)}
                              >
                                <FormControlLabel value="UPI" control={<Radio />} label="Paid via UPI (ex: Gpay, PhonePe etc...)" />
                                <FormControlLabel value="CASH" control={<Radio />} label="Paid via Cash" />
                              </RadioGroup>
                            </FormControl>
                          )}

                          {isPaymentPaidOnline && (
                            <Typography variant="body2" color="text.secondary" style={{ marginTop: "12px", fontWeight: 600 }}>
                              Payment paid online
                            </Typography>
                          )}
                        </>
                      )}

                      <TextField
                        fullWidth
                        label="Comments"
                        multiline
                        minRows={2}
                        value={deliveryComment}
                        onChange={(event) => setDeliveryComment(event.target.value)}
                        placeholder="Add delivery comments"
                        style={{ marginTop: "8px" }}
                      />

                      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          disabled={isDeliveryUpdateDisabled}
                          onClick={handleDeliveryUpdate}
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "#165d46",
                          }}
                        >
                          Update Delivery Status
                        </Button>
                      </div>
                    </>
                  )}

                  {deliveryLoading && canManageShipment && (
                    <Typography variant="body2" color="text.secondary" style={{ marginTop: "10px" }}>
                      Updating delivery status...
                    </Typography>
                  )}

                  {!!deliveryMessage && canManageShipment && (
                    <Typography variant="body2" style={{ marginTop: "10px", color: "#2e7d32", fontWeight: 600 }}>
                      {deliveryMessage}
                    </Typography>
                  )}

                  {!!deliveryError && canManageShipment && (
                    <Typography variant="body2" color="error" style={{ marginTop: "10px" }}>
                      {deliveryError}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

          </>
        )}
      </div>
    </>
  );
};

export default OrderSuccess;
