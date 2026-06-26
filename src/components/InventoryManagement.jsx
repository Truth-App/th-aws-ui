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
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventory } from "../store/slices/inventorySlice";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchUsers } from "../store/slices/usersSlice";
import { INVENTORY_API_URL } from "../constants/api";
import { ToastContainer, toast } from "react-toastify";
import { MdAddBox, MdEdit, MdVisibility } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import useMediaQuery from "@mui/material/useMediaQuery";

const SUPER_STOCKIST_ROLE = "Super Stockist";

const INITIAL_INVENTORY_FORM = {
  productid: "",
  userid: "",
  quantity: "",
};

const getItemProductId = (item) => item.productid || item.productId || "";
const getItemUserId = (item) => item.userid || item.userId || "";

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
  const details = [
    user.role,
    user.email,
    user.mobile,
    user.userId,
  ].filter(Boolean);

  return details.length > 0 ? `${name} (${details.join(", ")})` : name;
};

const mapInventoryToForm = (item) => ({
  productid: getItemProductId(item),
  userid: getItemUserId(item),
  quantity: item.quantity ?? "",
});

const InventoryFormFields = ({
  inventory,
  products,
  users,
  superStockistUsers,
  onChange,
  disabled = false,
  isMobile,
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
      disabled={disabled}
      required={!disabled}
    >
      {!disabled && (
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
      label="User (Super Stockist)"
      variant="outlined"
      name="userid"
      value={disabled ? getUserDetails(users, inventory.userid) : inventory.userid}
      onChange={onChange}
      disabled={disabled}
      required={!disabled}
    >
      {!disabled && (
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
    <TextField
      type="number"
      size="small"
      label="Quantity"
      variant="outlined"
      name="quantity"
      value={inventory.quantity}
      onChange={onChange}
      disabled={disabled}
      inputProps={{ min: 0, readOnly: disabled }}
      required={!disabled}
    />
  </div>
);

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

  const superStockistUsers = useMemo(
    () => users.filter((user) => user.role === SUPER_STOCKIST_ROLE),
    [users]
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
      const quantity = String(item.quantity ?? "");

      const searchable = [productLabel, userLabel, userRole, quantity].join(" ");
      const matchesSearch = !normalizedSearchTerm || searchable.includes(normalizedSearchTerm);
      const matchesProduct = !productFilter || productId === productFilter;
      const matchesUser = !userFilter || userId === userFilter;
      return matchesSearch && matchesProduct && matchesUser;
    });
  }, [inventoryItems, products, users, searchTerm, productFilter, userFilter]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInventory((prev) => ({ ...prev, [name]: value }));
  };

  const handleClickOpen = () => {
    setDialogMode("create");
    setEditingInventoryId(null);
    setInventory(INITIAL_INVENTORY_FORM);
    setOpen(true);
  };

  const handleOpenEdit = (selectedItem) => {
    setDialogMode("edit");
    setEditingInventoryId(selectedItem.id);
    setInventory(mapInventoryToForm(selectedItem));
    setOpen(true);
  };

  const handleOpenView = (selectedItem) => {
    setViewingInventory(mapInventoryToForm(selectedItem));
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
    if (inventory.quantity === "" || Number(inventory.quantity) < 0) {
      toast.error("Please enter a valid quantity");
      return false;
    }
    return true;
  };

  const handleSaveInventory = async () => {
    if (!validateInventory()) return;

    try {
      const isEditMode = dialogMode === "edit" && editingInventoryId !== null;
      const endpoint = isEditMode ? `${INVENTORY_API_URL}/${editingInventoryId}` : INVENTORY_API_URL;
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        productid: inventory.productid,
        userid: inventory.userid,
        quantity: Number(inventory.quantity),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Failed to ${isEditMode ? "update" : "save"} inventory`);
      }

      await response.json();
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
              label="Filter by user (Super Stockist)"
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
                      Quantity
                    </TableCell>    
                    <TableCell
                      align="right"
                      style={{ fontWeight: 700, color: "#165d46", backgroundColor: "#fafbf9", minWidth: 120 }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const productId = getItemProductId(item);
                    const userId = getItemUserId(item);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{getProductLabel(products, productId)}</TableCell>
                        <TableCell>{getUserLabel(users, userId)}</TableCell>                        
                        <TableCell>{item.quantity ?? "—"}</TableCell>                       
                        <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                          <IconButton
                            onClick={() => handleOpenView(item)}
                            size="small"
                            aria-label="View inventory"
                            style={{ color: "#165d46" }}
                          >
                            <MdVisibility size={20} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleOpenEdit(item)}
                            size="small"
                            aria-label="Edit inventory"
                            style={{ color: "#165d46" }}
                          >
                            <MdEdit size={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
