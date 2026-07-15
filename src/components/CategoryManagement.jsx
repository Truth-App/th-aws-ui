import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../store/slices/categorySlice";
import { CATEGORY_API_URL, PRESIGNED_URL_API, S3_BASE_URL } from "../constants/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useMediaQuery from "@mui/material/useMediaQuery";

const INITIAL_CATEGORY_FORM = {
  title: "",
  imageKey: "",
  isActive: true,
};

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { items: categories, status, error } = useSelector((state) => state.categories);

  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [category, setCategory] = useState(INITIAL_CATEGORY_FORM);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter] = useState(null);
  const fileInputRef = useRef(null);
  const latestImageKeyRef = useRef("");

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return categories.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const matchesSearch = !normalizedSearchTerm || title.includes(normalizedSearchTerm);
      const matchesCategory = !categoryFilter || item.title === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categories, searchTerm, categoryFilter]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  const sanitizeFileName = (fileName) => {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
  };

  const getPresignedUrl = async (fileName) => {
    const sanitized = sanitizeFileName(fileName);
    const query = new URLSearchParams({ fileName: sanitized });
    const response = await fetch(`${PRESIGNED_URL_API}?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status}`);
    }
    return response.json();
  };

  const uploadFileToS3 = async (file, presignedUrl) => {
    const fileType = file.type || "image/jpeg";
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": fileType },
    });
    if (!response.ok) {
      throw new Error(`File upload failed with status ${response.status}`);
    }
  };

  const getUploadedKey = (presignedData, fileName) => {
    if (presignedData?.key) return presignedData.key;
    if (presignedData?.Key) return presignedData.Key;

    if (presignedData?.url) {
      try {
        return decodeURIComponent(new URL(presignedData.url).pathname.slice(1));
      } catch {
        // fall through
      }
    }

    return sanitizeFileName(fileName);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      toast.error(`File ${file.name} is too large. Max 10MB allowed.`);
      return;
    }

    setUploadingFile(true);
    try {
      toast.info(`Uploading ${file.name}...`);
      const presignedData = await getPresignedUrl(file.name);
      await uploadFileToS3(file, presignedData.url);
      const uploadedKey = getUploadedKey(presignedData, file.name);
      latestImageKeyRef.current = uploadedKey;
      setCategory((prev) => ({ ...prev, imageKey: uploadedKey }));
      toast.success("Image uploaded successfully");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(`Upload failed: ${err?.message || "Please try again."}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveImage = () => {
    latestImageKeyRef.current = "";
    setCategory((prev) => ({ ...prev, imageKey: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickOpen = () => {
    setDialogMode("create");
    setEditingCategoryId(null);
    latestImageKeyRef.current = "";
    setCategory(INITIAL_CATEGORY_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(true);
  };

  const handleOpenEdit = (selectedCategory) => {
    setDialogMode("edit");
    setEditingCategoryId(selectedCategory.id);
    const existingImageKey = selectedCategory.imageKey || selectedCategory.imagekey || "";
    latestImageKeyRef.current = existingImageKey;
    setCategory({
      title: selectedCategory.title || "",
      imageKey: existingImageKey,
      isActive: selectedCategory.isActive ?? true,
    });
    setOpen(true);
  };

  const handleClose = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setOpen(false);
  };

  const handleSaveCategory = async () => {
    const imageKey = latestImageKeyRef.current || category.imageKey;
    if (!category.title.trim()) {
      toast.error("Please enter a category title");
      return;
    }
    if (!imageKey) {
      toast.error("Please upload a category image");
      return;
    }

    try {
      const isEditMode = dialogMode === "edit" && editingCategoryId !== null;
      const endpoint = isEditMode ? `${CATEGORY_API_URL}/${editingCategoryId}` : CATEGORY_API_URL;
      const method = isEditMode ? "PUT" : "POST";

      const payload = JSON.stringify({
        title: category.title.trim(),
        imageKey,
        imagekey: imageKey,
        isActive: category.isActive !== false,
      });
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? "update" : "save"} category`);
      }

      await response.json();
      toast.success(isEditMode ? "Category updated successfully" : "Category added successfully");
      dispatch(fetchCategories());
      setEditingCategoryId(null);
      latestImageKeyRef.current = "";
      setCategory(INITIAL_CATEGORY_FORM);
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Unable to save category");
    }
  };

  const getImageUrl = (imageKey) => {
    if (!imageKey) return "/thriftyhomelogo.png";
    return `${S3_BASE_URL}/${imageKey}`;
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
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              style={{ flex: isMobile ? "0 0 auto" : "1 1 260px", width: "100%" }}
              label="Search categories"
            />
          </div>

          {status === "loading" && <Typography style={{ marginTop: "1em" }}>Loading categories...</Typography>}
          {status === "failed" && (
            <Typography color="error" style={{ marginTop: "1em" }}>
              {error}
            </Typography>
          )}

          {filteredCategories.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : isTablet
                    ? "repeat(3, minmax(0, 1fr))"
                    : "repeat(auto-fill, minmax(180px, 1fr))",
                gap: isMobile ? "8px" : "16px",
                marginTop: "0.75em",
              }}
            >
              {filteredCategories.map((item) => {
                const isInactive = item.isActive === false;
                return (
                  <Card
                    key={item.id}
                    variant="outlined"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      opacity: isInactive ? 0.7 : 1,
                      position: "relative",
                    }}
                  >
                    {isInactive && (
                      <div
                        style={{
                          position: "absolute",
                          top: isMobile ? "4px" : "6px",
                          right: isMobile ? "4px" : "6px",
                          zIndex: 1,
                        }}
                      >
                        <Chip
                          label="In active"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{
                            fontSize: isMobile ? "0.6rem" : "0.7rem",
                            height: isMobile ? "22px" : "24px",
                            backgroundColor: "#fff",
                          }}
                        />
                      </div>
                    )}
                    <CardMedia
                      component="img"
                      height="140"
                      image={getImageUrl(item.imageKey)}
                      alt={item.title}
                      style={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
                    />
                    <CardContent style={{ padding: "8px 12px", flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: 600, color: "#165d46", textAlign: "center" }}
                      >
                        {item.title}
                      </Typography>
                    </CardContent>
                    <CardActions style={{ display: "flex", justifyContent: "flex-end", padding: "0 12px 8px" }}>
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        size="small"
                        variant="contained"
                        style={{ backgroundColor: "#165d46", textTransform: "none", fontWeight: "bold" }}
                      >
                        Update
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
            </div>
          )}

          {status === "succeeded" && categories.length === 0 && (
            <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
              No categories yet. Add your first category.
            </Typography>
          )}

          {status === "succeeded" && categories.length > 0 && filteredCategories.length === 0 && (
            <Typography style={{ marginTop: "1.5em", textAlign: "center", color: "#6f7378" }}>
              No categories match your filters.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} scroll="paper">
        <DialogTitle>{dialogMode === "edit" ? "Update Category" : "Add Category"}</DialogTitle>
        <DialogContent dividers>
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
              size="small"
              label="Category Title"
              variant="outlined"
              name="title"
              value={category.title}
              onChange={handleOnChange}
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={category.isActive !== false}
                  onChange={(e) =>
                    setCategory((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label={category.isActive !== false ? "Active" : "Inactive"}
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                accept="image/*"
              />
              {uploadingFile && (
                <Typography variant="body2" style={{ marginTop: "0.5em", color: "#1976d2" }}>
                  Uploading image...
                </Typography>
              )}
              {category.imageKey && (
                <div style={{ marginTop: "1em" }}>
                  <Typography variant="body2" style={{ fontWeight: "bold", marginBottom: "0.5em" }}>
                    Uploaded Image:
                  </Typography>
                  <div style={{ position: "relative", width: "120px", height: "120px" }}>
                    <img
                      src={getImageUrl(category.imageKey)}
                      alt="Category preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                      }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={handleRemoveImage}
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
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveCategory} disabled={uploadingFile}>
            {dialogMode === "edit" ? "Update category" : "Add category"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategoryManagement;
