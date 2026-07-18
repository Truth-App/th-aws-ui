export const CHART_COLORS = [
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

export const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    fromDate: toInputDate(start),
    toDate: toInputDate(end),
  };
};

export const startOfDay = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const endOfDay = (value) => {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDisplayDate = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const getOrderCreatedDate = (order) => {
  const raw = order?.createdAt || "";
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getOrderPincode = (order) => {
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

export const getOrderCity = (order) =>
  order?.shippingAddress?.city ||
  order?.deliveryAddress?.city ||
  order?.address?.city ||
  order?.customerAddress?.city ||
  "—";

export const getCustomerName = (order) => order?.user?.fullName || order?.user?.name || "—";

export const getOrderAmount = (order) => Number(order?.amount?.total || 0);

export const getProductLineAmount = (item) => {
  if (item?.subTotal != null) return Number(item.subTotal) || 0;
  return (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
};

export const getProductId = (item) =>
  item?.id || item?.productId || item?._id || item?.inventoryId || "";

export const buildDailyKeys = (fromDate, toDate) => {
  const from = startOfDay(fromDate);
  const to = endOfDay(toDate);
  if (!from || !to) return [];

  const keys = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    keys.push(toInputDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

export const formatDayLabel = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
