import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import React, { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import CategoryCarousel from "./CategoryCarousel";
import { categories as fallbackCategories } from "../constants/products";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";
import { PRODUCT_API_URL, PRESIGNED_URL_API } from "../constants/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useMediaQuery from "@mui/material/useMediaQuery";

const INITIAL_PRODUCT_FORM = {
  title: "",
  mrpPrice: "",
  customerPrice: "",
  superStockistPrice: "",
  stockistPrice: "",
  dealerPrice: "",
  category: "",
  isActive: true,
  imageKeys: [],
};

const PRODUCT_PRICE_FIELDS = new Set([
  "mrpPrice",
  "customerPrice",
  "superStockistPrice",
  "stockistPrice",
  "dealerPrice",
]);

const mapProductToForm = (selectedProduct) => ({
  title: selectedProduct.title || "",
  mrpPrice: selectedProduct.mrpPrice ?? "",
  customerPrice: selectedProduct.customerPrice ?? "",
  superStockistPrice:
    selectedProduct.superStockistPrice ?? selectedProduct.superstockistprice ?? "",
  stockistPrice: selectedProduct.stockistPrice ?? "",
  dealerPrice: selectedProduct.dealerPrice ?? "",
  category: selectedProduct.category || "",
  isActive: selectedProduct.isActive ?? true,
  imageKeys:
    selectedProduct.imageKeys || selectedProduct.images || selectedProduct.fileKeys || [],
});

const DashboardFeatureDetail = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { items: products, status, error } = useSelector((state) => state.products);
  const { items: categoryItems } = useSelector((state) => state.categories);
  const catalogCategories = categoryItems.length > 0
    ? categoryItems
        .filter((item) => item?.isActive !== false)
        .map((item) => ({
          title: item?.title || "",
          imageKey: item?.imageKey || item?.imagekey || "",
        }))
        .filter((item) => item.title)
    : [];
  const productCategories = categoryItems.length > 0
    ? categoryItems.map((item) => item.title)
    : fallbackCategories;
  const [open, setOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Items");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [product, setProduct] = useState(INITIAL_PRODUCT_FORM);
  const fileInputRef = React.useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
    dispatch(fetchCategories());
  }, [dispatch, status]);

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return products.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const category = item.category || "";
      const matchesSearch =
        !normalizedSearchTerm ||
        title.includes(normalizedSearchTerm) ||
        description.includes(normalizedSearchTerm);
      const matchesCategory = categoryFilter === "All Items" || category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: PRODUCT_PRICE_FIELDS.has(name) ? Number(value) : value,
    }));
  };

  const handleClickOpen = () => {
    setDialogMode("create");
    setEditingProductId(null);
    setProduct(INITIAL_PRODUCT_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(true);
  };

  const handleOpenEdit = (selectedProduct) => {
    setDialogMode("edit");
    setEditingProductId(selectedProduct.id);
    setProduct(mapProductToForm(selectedProduct));
    setOpen(true);
  };

  const sanitizeFileName = (fileName) => {
    // Remove special characters and replace spaces with underscores
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
  };

  const getPresignedUrl = async (fileName) => {
    try {
      const sanitized = sanitizeFileName(fileName);
      const query = new URLSearchParams({ fileName: sanitized });
      const response = await fetch(`${PRESIGNED_URL_API}?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to get presigned URL: ${response.status}`);
      }
      const data = await response.json();
      return data; // { url, key }
    } catch (err) {
      console.error("Error getting presigned URL:", err);
      throw err;
    }
  };

  const uploadFileToS3 = async (file, presignedUrl) => {
    try {
      const fileType = file.type || "image/jpeg";
      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": fileType,
        },
      });

      if (!response.ok) {
        throw new Error(`File upload failed with status ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error("Error uploading file to S3:", err);
      throw err;
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file size (max 10MB per file)
    const maxFileSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} is too large. Max 10MB allowed.`);
        return;
      }
    }

    setUploadingFiles(true);
    const uploadedKeys = [...(product.imageKeys || [])];

    try {
      for (const file of files) {
        toast.info(`Uploading ${file.name}...`);
        const presignedData = await getPresignedUrl(file.name);
        await uploadFileToS3(file, presignedData.url);
        uploadedKeys.push(presignedData.key);
      }

      setProduct((prev) => ({
        ...prev,
        imageKeys: uploadedKeys,
      }));

      toast.success(`Successfully uploaded ${uploadedKeys.length} file(s)`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("File upload failed:", err);
      toast.error(`Upload failed: ${err?.message || "Please try again."}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setProduct((prev) => ({
      ...prev,
      imageKeys: prev.imageKeys.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleClose = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(false);
  };

  const handleSaveProduct = async () => {
    // Validate required fields
    if (
      !product.title ||
      !product.mrpPrice ||
      !product.customerPrice ||
      product.superStockistPrice === "" ||
      product.dealerPrice === "" ||
      product.stockistPrice === "" ||
      !product.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const isEditMode = dialogMode === "edit" && editingProductId !== null;
      const endpoint = isEditMode ? `${PRODUCT_API_URL}/${editingProductId}` : PRODUCT_API_URL;
      const method = isEditMode ? "PUT" : "POST";
      const { fileKeys, images, ...restProduct } = product;
      const payload = {
        ...restProduct,
        imageKeys: product.imageKeys || images || fileKeys || [],
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? "update" : "save"} product`);
      }

      await response.json();
      toast.success(isEditMode ? "Product updated successfully" : "Product added successfully");
      dispatch(fetchProducts());
      setEditingProductId(null);
      setProduct(INITIAL_PRODUCT_FORM);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      handleClose();
    } catch (err) {
      console.log(err);
      toast.error(err?.message || "Unable to save product");
    }
  };

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  return (
    <>
      <ToastContainer position={isMobile ? "top-center" : "top-right"} autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
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
            <Button
              onClick={handleClickOpen}
              size="small"
              variant="contained"
              style={{
                margin: "5px 0",
                backgroundColor: "#165d46",
                textTransform: "none",
                fontWeight: "bolder",
              }}
            >
              + Add
            </Button>
          </div>

          {categoryFilter === "All Items" && (
            <div
              style={{
                marginTop: 0,
                backgroundColor: "#fafbf9",
                padding: 0,
                borderRadius: "8px",
              }}
            >
              <CategoryCarousel
                selectedCategory={null}
                onCategorySelect={(category) => {
                  setCategoryFilter(category || "All Items");
                  setPage(1);
                }}
                items={catalogCategories.length > 0 ? catalogCategories : fallbackCategories}
              />
            </div>
          )}

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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              size="small"
              style={{ flex: isMobile ? "0 0 auto" : "1 1 260px", width: "100%" }}
              label="Search products"
            />
          </div>

          {categoryFilter !== "All Items" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5em",
                marginTop: "0.75em",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("All Items");
                  setPage(1);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#6f7378",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                }}
              >
                Home
              </button>
              <Typography variant="body2" style={{ color: "#6f7378" }}>
                &gt;
              </Typography>
              <Typography variant="body2" style={{ color: "#165d46", fontWeight: 600 }}>
                {categoryFilter}
              </Typography>
            </div>
          )}

          {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading products...</Typography>}
          {status === "failed" && (
            <Typography color="error" style={{ marginTop: "1em" }}>
              {error}
            </Typography>
          )}

          {visibleProducts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(240px, 240px))",
                gap: isMobile ? "8px" : "16px",
                marginTop: isMobile ? "0.5em" : "0.75em",
                justifyContent: isTablet ? "stretch" : "center",
              }}
            >
              {visibleProducts.map((item) => (
                <div style={{ display: "flex", minWidth: 0 }} key={item.id}>
                  <ProductCard
                    product={item}
                    actionType="update"
                    actionLabel="Update"
                    onAction={handleOpenEdit}
                  />
                </div>
              ))}
            </div>
          )}

          {status === "succeeded" && filteredProducts.length === 0 && (
            <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
              No products match your filters.
            </Typography>
          )}

          {filteredProducts.length > 0 && totalPages > 1 && (
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
        </CardContent>
      </Card>
      <Dialog open={open} onClose={handleClose} scroll="paper">
        <DialogTitle id="scroll-dialog-title">
          {dialogMode === "edit" ? "Update Product" : "Add New Product"}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
            style={{ marginBottom: "1em" }}
          ></DialogContentText>
          <div style={{ display: "flex", flexDirection: "column", gap: "1em", width: isMobile ? "100%" : "400px", maxWidth: "100%" }}>
            <TextField
              size="small"
              id="outlined-basic"
              label="Product Name"
              variant="outlined"
              name="title"
              value={product.title}
              onChange={handleOnChange}
              required
            />
            <TextField
              type="number"
              size="small"
              id="outlined-basic"
              label="MRP Price"
              variant="outlined"
              name="mrpPrice"
              value={product.mrpPrice}
              onChange={handleOnChange}
              required
            />
            <TextField
              type="number"
              size="small"
              id="outlined-basic"
              label="Customer Price"
              variant="outlined"
              name="customerPrice"
              value={product.customerPrice}
              onChange={handleOnChange}
              required
            />
            <TextField
              type="number"
              size="small"
              id="outlined-dealer-price"
              label="Dealer Price"
              variant="outlined"
              name="dealerPrice"
              value={product.dealerPrice}
              onChange={handleOnChange}
              required
            />
            <TextField
              type="number"
              size="small"
              id="outlined-stockist-price"
              label="Stockist Price"
              variant="outlined"
              name="stockistPrice"
              value={product.stockistPrice}
              onChange={handleOnChange}
              required
            />
            <TextField
              type="number"
              size="small"
              id="outlined-super-stockist-price"
              label="Super Stockist Price"
              variant="outlined"
              name="superStockistPrice"
              value={product.superStockistPrice}
              onChange={handleOnChange}
              required
            />
            <TextField
              select
              size="small"
              id="outlined-category"
              label="Category"
              variant="outlined"
              name="category"
              value={product.category}
              onChange={handleOnChange}
              required
            >
              <MenuItem value="" disabled>
                Select category
              </MenuItem>
              {productCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={product.isActive}
                  onChange={(e) =>
                    setProduct((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label={product.isActive ? "Active" : "Inactive"}
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingFiles}
                accept="image/*"
              />
              {uploadingFiles && <Typography variant="body2" style={{ marginTop: "0.5em", color: "#1976d2" }}>Uploading files...</Typography>}
            </div>
            {product.imageKeys && product.imageKeys.length > 0 && (
              <div style={{ marginTop: "1em" }}>
                <Typography variant="body2" style={{ fontWeight: "bold", marginBottom: "0.5em" }}>
                  Uploaded Images:
                </Typography>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.75em" }}>
                  {product.imageKeys.map((key, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "100%",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={`https://th-app-product.s3.ap-south-2.amazonaws.com/${key}`}
                        alt="Uploaded thumbnail"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "4px",
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          padding: "2px 4px",
                          minWidth: "auto",
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveProduct}>
            {dialogMode === "edit" ? "Update product" : "Add product"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardFeatureDetail;
