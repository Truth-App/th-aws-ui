import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventory } from "../store/slices/inventorySlice";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchUsers } from "../store/slices/usersSlice";
import { createInventory, updateInventory } from "../api/Inventory";
import { ToastContainer, toast } from "react-toastify";
import { MdAddBox, MdEdit, MdVisibility, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import useMediaQuery from "@mui/material/useMediaQuery";

const SUPER_STOCKIST_ROLE = "Super Stockist";

const INITIAL_INVENTORY_FORM = {
  productid: "",
  userid: "",
  stockquantity: "0",
  stockhistory: [],
  previousstockquantity: 0,
  userId: "",
};

const IST_TIME_ZONE = "Asia/Kolkata";

const getISTDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

const getTodayDateString = () => {
  const { year, month, day, hour, minute, second } = getISTDateParts();
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
};

const getItemProductId = (item) => item.productid || item.productId || "";
const getItemUserId = (item) => item.userid || item.userId || "";
const getItemStockQuantity = (item) => Number(item?.stockquantity ?? item?.quantity ?? 0);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatStockDateDisplay = (dateStr) => {
  if (!dateStr) return "—";

  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime()) && String(dateStr).includes("T")) {
    const { year, month, day, hour, minute, second } = getISTDateParts(parsed);
    const monthIndex = Number(month) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) {
      return `${Number(day)} ${MONTH_LABELS[monthIndex]} ${year}, ${hour}:${minute}:${second} IST`;
    }
  }

  const normalized = String(dateStr).slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return dateStr;

  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;

  return `${Number(day)} ${MONTH_LABELS[monthIndex]} ${year}`;
};

const normalizeStockHistoryEntry = (entry) => ({
  quantity: entry?.quantity ?? entry?.stockquantity ?? entry?.stockQuantity ?? 0,
  stockdate: entry?.stockdate || entry?.stockDate || "",
});

const getStockHistory = (item) => {
  const raw = item?.stockhistory ?? item?.stockHistory ?? null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeStockHistoryEntry);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeStockHistoryEntry);
    } catch {
      return [];
    }
  }
  return [];
};

const getUserReferenceNumber = (user) =>
  user?.referencenumber || user?.referenceNumber || "";

const getUserReferenceIdForInventory = (users, selectedUserId) => {
  const selectedUser = users.find((item) => item.id === selectedUserId);
  if (!selectedUser) return "";
  return getUserReferenceNumber(selectedUser) || selectedUser.userId || "";
};

const getProductLabel = (products, productId) => {
  const product = products.find((item) => item.id === productId);
  return product?.title || "—";
};

const getUserLabel = (users, userId) => {
  const user = users.find((item) => item.id === userId);
  if (!user) return "—";
  const first = user.firstname || user.firstName || "";
  const last = user.lastname || user.lastName || "";
  return `${first} ${last}`.trim() || "—";
};

const getUserRole = (users, userId) => {
  const user = users.find((item) => item.id === userId);
  return user?.role || "—";
};

const getUserDetails = (users, userId) => {
  const user = users.find((item) => item.id === userId);
  if (!user) return "—";

  const name = getUserLabel(users, userId);
  const details = [user.role, user.email, user.mobile, user.userId].filter(Boolean);

  return details.length > 0 ? `${name} (${details.join(", ")})` : name;
};

const mapInventoryToViewForm = (item) => ({
  productid: getItemProductId(item),
  userid: getItemUserId(item),
  stockquantity: getItemStockQuantity(item),
  stockhistory: getStockHistory(item),
});

const mapInventoryToEditForm = (item) => {
  const existingQuantity = Number(getItemStockQuantity(item)) || 0;

  return {
    productid: getItemProductId(item),
    userid: getItemUserId(item),
    stockquantity: String(existingQuantity),
    previousstockquantity: existingQuantity,
    stockhistory: getStockHistory(item),
  };
};

const StockHistoryTable = ({ history = [], title = "Stock History" }) => (
  <div style={{ marginTop: "0.5em" }}>
    <Typography variant="body2" style={{ fontWeight: 600, color: "#165d46", marginBottom: "0.5em" }}>
      {title}
    </Typography>
    <TableContainer
      component={Paper}
      variant="outlined"
      style={{ border: "1px solid #e8efeb", boxShadow: "none" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
              Quantity
            </TableCell>
            <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
              Stock Date
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} style={{ textAlign: "center", color: "#6f7378" }}>
                No stock history yet.
              </TableCell>
            </TableRow>
          )}
          {history.map((entry, index) => (
            <TableRow key={`${entry.stockdate}-${entry.quantity}-${index}`}>
              <TableCell>{entry.quantity ?? "—"}</TableCell>
              <TableCell>{formatStockDateDisplay(entry.stockdate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

const InventoryFormFields = ({
  inventory,
  products,
  users,
  superStockistUsers,
  onChange,
  disabled = false,
  isMobile,
  isEditMode = false,
  showStockHistory = false,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "1em",
      width: isMobile ? "100%" : "400px",
      maxWidth: "100%",
    }}
  >
    <TextField
      select={!disabled}
      size="small"
      label="Product"
      variant="outlined"
      name="productid"
      value={disabled ? getProductLabel(products, inventory.productid) : inventory.productid}
      onChange={onChange}
      disabled={disabled || isEditMode}
      required={!disabled}
    >
      {!disabled && !isEditMode && (
        <MenuItem value="" disabled>
          Select product
        </MenuItem>
      )}
      {products.map((product) => (
        <MenuItem key={product.id} value={product.id}>
          {product.title}
        </MenuItem>
      ))}
    </TextField>
    <TextField
      select={!disabled}
      size="small"
      label="User (Super Stockist or Administrator)"
      variant="outlined"
      name="userid"
      value={disabled ? getUserDetails(users, inventory.userid) : inventory.userid}
      onChange={onChange}
      disabled={disabled || isEditMode}
      required={!disabled}
    >
      {!disabled && !isEditMode && (
        <MenuItem value="" disabled>
          Select user
        </MenuItem>
      )}
      {superStockistUsers.map((user) => (
        <MenuItem key={user.id} value={user.id}>
          {user.firstname || user.firstName} {user.lastname || user.lastName}
        </MenuItem>
      ))}
    </TextField>
    {disabled && (
      <TextField
        size="small"
        label="Stock Quantity"
        variant="outlined"
        value={inventory.stockquantity ?? "—"}
        disabled
      />
    )}
    {!disabled && (
      <TextField
        type="number"
        size="small"
        label="Stock Quantity"
        variant="outlined"
        name="stockquantity"
        value={inventory.stockquantity ?? ""}
        onChange={onChange}
        inputProps={{ min: 0 }}
        required
      />
    )}
    {showStockHistory && <StockHistoryTable history={inventory.stockhistory || []} />}
  </div>
);

const InventoryRow = ({ item, products, users, expanded, onToggle, onToggleView, onToggleEdit }) => {
  const productId = getItemProductId(item);
  const userId = getItemUserId(item);
  const stockHistory = getStockHistory(item);

  return (
    <>
      <TableRow hover>
        <TableCell>{getProductLabel(products, productId)}</TableCell>
        <TableCell>{getUserLabel(users, userId)}</TableCell>
        <TableCell>{getItemStockQuantity(item) ?? "—"}</TableCell>
        <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
          <IconButton
            onClick={() => onToggleView(item)}
            size="small"
            aria-label="View inventory"
            style={{ color: "#165d46" }}
          >
            <MdVisibility size={20} />
          </IconButton>
          <IconButton
            onClick={() => onToggleEdit(item)}
            size="small"
            aria-label="Edit inventory"
            style={{ color: "#165d46" }}
          >
            <MdEdit size={20} />
          </IconButton>
        </TableCell>
        <TableCell align="center" style={{ width: 40 }}>
          <IconButton
            size="small"
            onClick={onToggle}
            aria-label={expanded ? "Collapse stock history" : "Expand stock history"}
            style={{ color: "#165d46" }}
          >
            {expanded ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} style={{ paddingBottom: 0, paddingTop: 0, borderBottom: expanded ? undefined : "none" }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <div style={{ padding: "0.75em 0 1em" }}>
              <StockHistoryTable history={stockHistory} />
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { items: inventoryItems, status, error } = useSelector((state) => state.inventory);
  const { items: products, status: productsStatus } = useSelector((state) => state.products);
  const { items: users, status: usersStatus } = useSelector((state) => state.users);

  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingInventory, setViewingInventory] = useState(null);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);

  const superStockistUsers = useMemo(
    () => users.filter((user) => user.role === SUPER_STOCKIST_ROLE || user.role === "Administrator"),
    [users],
  );

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInventory());
    }
    if (productsStatus === "idle") {
      dispatch(fetchProducts());
    }
    if (usersStatus === "idle") {
      dispatch(fetchUsers());
    }
  }, [dispatch, status, productsStatus, usersStatus]);

  const filteredInventory = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      const productId = getItemProductId(item);
      const userId = getItemUserId(item);
      const productLabel = getProductLabel(products, productId).toLowerCase();
      const userLabel = getUserLabel(users, userId).toLowerCase();
      const userRole = getUserRole(users, userId).toLowerCase();
      const stockQuantity = String(getItemStockQuantity(item) ?? "");

      const searchable = [productLabel, userLabel, userRole, stockQuantity].join(" ");
      const matchesSearch = !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
      const matchesProduct = !productFilter || productId === productFilter;
      const matchesUser = !userFilter || userId === userFilter;
      return matchesSearch && matchesProduct && matchesUser;
    });
  }, [inventoryItems, products, users, searchTerm, productFilter, userFilter]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    if (name === "userid") {
      setInventory((prev) => ({
        ...prev,
        userid: value,
        userId: getUserReferenceIdForInventory(users, value),
      }));
      return;
    }
    setInventory((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickOpen = () => {
    setDialogMode("create");
    setEditingInventoryId(null);
    setInventory({ ...INITIAL_INVENTORY_FORM, stockquantity: "0" });
    setOpen(true);
  };

  const handleOpenEdit = (selectedItem) => {
    setDialogMode("edit");
    setEditingInventoryId(selectedItem.id);
    setInventory(mapInventoryToEditForm(selectedItem));
    setOpen(true);
  };

  const handleOpenView = (selectedItem) => {
    setViewingInventory(mapInventoryToViewForm(selectedItem));
    setViewOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewingInventory(null);
  };

  const validateInventory = () => {
    if (!inventory.productid) {
      toast.error("Please select a product");
      return false;
    }
    if (!inventory.userid) {
      toast.error("Please select a user");
      return false;
    }
    if (inventory.stockquantity === "" || Number(inventory.stockquantity) < 0) {
      toast.error("Please enter a valid stock quantity");
      return false;
    }
    return true;
  };

  const buildStockHistoryPayload = (existingHistory = [], isEditMode = false) => {
    const newQuantity = Number(inventory.stockquantity);
    const updatedQuantity = newQuantity + (isEditMode ? Number(inventory.previousstockquantity) : 0);
    const stockdate = getTodayDateString();
    let stockhistory = [...existingHistory];

    stockhistory = [...stockhistory, { quantity: newQuantity, stockdate }];
    /*
    if (isEditMode) { 
        stockhistory = [...stockhistory, { quantity: updatedQuantity, stockdate }];
    } else if (newQuantity > 0) {
      stockhistory = [{ quantity: updatedQuantity, stockdate }];
    } */

    return {
      stockquantity: updatedQuantity,
      stockhistory,
    };
  };

  const handleSaveInventory = async () => {
    if (!validateInventory()) return;

    try {
      const isEditMode = dialogMode === "edit" && editingInventoryId !== null;
      const stockPayload = buildStockHistoryPayload(
        isEditMode ? inventory.stockhistory || [] : [],
        isEditMode,
      );

      const payload = {
        productid: inventory.productid,
        userid: inventory.userid,
        stockquantity: stockPayload.stockquantity,
        stockhistory: stockPayload.stockhistory,
      };

      if (isEditMode) {
        await updateInventory(editingInventoryId, payload);
      } else {
        await createInventory({
          ...payload,
          userId: inventory.userId || getUserReferenceIdForInventory(users, inventory.userid),
        });
      }
      toast.success(isEditMode ? "Inventory updated successfully" : "Inventory added successfully");
      dispatch(fetchInventory());
      setEditingInventoryId(null);
      setInventory(INITIAL_INVENTORY_FORM);
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Unable to save inventory");
    }
  };

  return (
    <>
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
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
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: "1em",
            }}
          >
            <IconButton
              onClick={handleClickOpen}
              size="small"
              aria-label="Add inventory"
              style={{ color: "#165d46" }}
            >
              <MdAddBox size={50} style={{ fontSize: "20px" }} />
            </IconButton>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: isMobile ? "0.25em" : "1em",
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <TextField
              select
              size="small"
              label="Filter by product"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              style={{ flex: isMobile ? "0 0 auto" : "1 1 200px", minWidth: isMobile ? "100%" : 180 }}
            >
              <MenuItem value="">All products</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Filter by user (Super Stockist or Administrator)"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ flex: isMobile ? "0 0 auto" : "1 1 200px", minWidth: isMobile ? "100%" : 180 }}
            >
              <MenuItem value="">All users</MenuItem>
              {superStockistUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstname || user.firstName} {user.lastname || user.lastName}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading inventory...</Typography>}
          {status === "failed" && (
            <Typography color="error" style={{ marginTop: "1em" }}>
              {error}
            </Typography>
          )}

          {filteredInventory.length > 0 && (
            <TableContainer
              component={Paper}
              variant="outlined"
              style={{
                marginTop: "0.75em",
                overflowX: "auto",
                border: "1px solid #e8efeb",
                boxShadow: "none",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Product
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      User
                    </TableCell>
                    <TableCell style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9" }}>
                      Stock Quantity
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9", minWidth: 120 }}
                    >
                      Action
                    </TableCell>
                    <TableCell
                      align="center"
                      style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9", width: 40 }}
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <InventoryRow
                      key={item.id}
                      item={item}
                      products={products}
                      users={users}
                      expanded={expandedRowId === item.id}
                      onToggle={() =>
                        setExpandedRowId((prev) => (prev === item.id ? null : item.id))
                      }
                      onToggleView={handleOpenView}
                      onToggleEdit={handleOpenEdit}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {status === "succeeded" && inventoryItems.length === 0 && (
            <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
              No inventory yet. Add your first inventory record.
            </Typography>
          )}

          {status === "succeeded" && inventoryItems.length > 0 && filteredInventory.length === 0 && (
            <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
              No inventory matches your filters.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} scroll="paper">
        <DialogTitle>{dialogMode === "edit" ? "Update Inventory" : "Add Inventory"}</DialogTitle>
        <DialogContent dividers>
          <InventoryFormFields
            inventory={inventory}
            products={products}
            users={users}
            superStockistUsers={superStockistUsers}
            onChange={handleOnChange}
            isMobile={isMobile}
            isEditMode={dialogMode === "edit"}
            showStockHistory={dialogMode === "edit"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveInventory}>
            {dialogMode === "edit" ? "Update inventory" : "Add inventory"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={handleCloseView} scroll="paper">
        <DialogTitle>View Inventory</DialogTitle>
        <DialogContent dividers>
          {viewingInventory && (
            <InventoryFormFields
              inventory={viewingInventory}
              products={products}
              users={users}
              superStockistUsers={superStockistUsers}
              onChange={() => {}}
              disabled
              isMobile={isMobile}
              showStockHistory
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InventoryManagement;
