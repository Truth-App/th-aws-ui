import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdClose, MdAdd, MdRemove } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../store/slices/cartSlice";
import { useState } from "react";

const ProductCard = ({ product, actionType = "cart", actionLabel = "Update Product", onAction }) => {
  const dispatch = useDispatch();
  const selector = useSelector((state) => state.cart);
  const cartProduct = selector.find((item) => item.id === product.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isMobile = useMediaQuery("(max-width:600px)");

  const isUpdateMode = actionType === "update";
  const defaultImagePath = "/thriftyhomelogo.png";
  const imageKeys = product.imageKeys || product.fileKeys || [];
  
  let imagePath = defaultImagePath;
  if (imageKeys.length > 0) {
    imagePath = `https://th-app-product.s3.ap-south-2.amazonaws.com/${imageKeys[currentImageIndex]}`;
  }

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageKeys.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imageKeys.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setZoomModalOpen(true);
    setZoomLevel(1);
  };

  const handleCloseZoom = () => {
    setZoomModalOpen(false);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1));
  };

  const handleModalPrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageKeys.length - 1 : prev - 1));
  };

  const handleModalNextImage = () => {
    setCurrentImageIndex((prev) => (prev === imageKeys.length - 1 ? 0 : prev + 1));
  };
  return (
    <>
      <Card
        variant="outlined"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ backgroundColor: "#f5f5f5", position: "relative" }}>
          <CardMedia
            component="img"
            onClick={handleImageClick}
            sx={{
              height: 160,
              width: "100%",
              objectFit: "contain",
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
            }}
            src={imagePath}
            alt={product.title}
          />
          {imageKeys.length > 1 && (
            <>
              <Button
                onClick={handlePrevImage}
                size="small"
                style={{
                  position: "absolute",
                  left: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  minWidth: isMobile ? "22px" : "28px",
                  padding: isMobile ? "2px" : "4px",
                  borderRadius: "50%",
                  fontSize: isMobile ? "10px" : "14px",
                }}
              >
                ❮
              </Button>
              <Typography
                variant="caption"
                style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: isMobile ? "9px" : "11px",
                }}
              >
                {currentImageIndex + 1} / {imageKeys.length}
              </Typography>
              <Button
                onClick={handleNextImage}
                size="small"
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  minWidth: isMobile ? "22px" : "28px",
                  padding: isMobile ? "2px" : "4px",
                  borderRadius: "50%",
                  fontSize: isMobile ? "10px" : "14px",
                }}
              >
                ❯
              </Button>
            </>
          )}
        </div>
        <CardContent style={{ flexGrow: 1, padding: "8px 12px" }}>
          <Typography gutterBottom={false} variant="h6" component="div" sx={{ fontSize: isMobile ? "0.9rem" : "0.94rem", margin: "0 0 0.3em 0", lineHeight: 1.2 }}>
            {product.title}
          </Typography>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.4em",
              marginBottom: 0,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              MRP{" "}
              <span style={{ textDecoration: "line-through" }}>
                ₹{product.mrpPrice}
              </span>
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              <span style={{ fontWeight: "bold" }}>
                ₹{product.customerPrice}
              </span>
            </Typography>
          </div>
        </CardContent>
        <CardActions style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: isMobile ? "4px 8px 6px" : "0px 12px 2px 12px" }}>
          {isUpdateMode ? (
            <Button
              onClick={() => onAction?.(product)}
              size="small"
              variant="contained"
              style={{ backgroundColor: "#165d46", textTransform: "none", fontWeight: "bold", fontSize: isMobile ? "0.7rem" : undefined }}
            >
              {actionLabel}
            </Button>
          ) : cartProduct ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "0.15em" : "0.4em",
                border: "1px solid #cfd8d2",
                borderRadius: "999px",
                padding: isMobile ? "0.1em 0.15em" : "0.2em 0.35em",
                backgroundColor: "#f7faf8",
              }}
            >
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  dispatch(removeFromCart(product));
                }}
                style={{
                  minWidth: "30px",
                  width: "30px",
                  height: "30px",
                  borderRadius: "999px",
                  backgroundColor: "#e8efeb",
                  color: "#165d46",
                  boxShadow: "none",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                <MdRemove size={16} />
              </Button>
              <span
                style={{
                  minWidth: "2.2ch",
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#1f3d31",
                  fontSize: "0.95rem",
                }}
              >
                {cartProduct.quantity}
              </span>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  dispatch(addToCart(product));
                }}
                style={{
                  minWidth: "30px",
                  width: "30px",
                  height: "30px",
                  borderRadius: "999px",
                  backgroundColor: "#165d46",
                  color: "#fff",
                  boxShadow: "none",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                <MdAdd size={16} />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                dispatch(addToCart(product));
              }}
              size="small"
              variant="contained"
              style={{ backgroundColor: "#165d46", textTransform: "none", fontSize: isMobile ? "0.7rem" : undefined }}
            >
              + Add
            </Button>
          )}
        </CardActions>
      </Card>

      <Dialog
        open={zoomModalOpen}
        onClose={handleCloseZoom}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: { backgroundColor: "#000" },
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            backgroundColor: "#000",
          }}
        >
          <IconButton
            onClick={handleCloseZoom}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              color: "white",
              zIndex: 1,
            }}
          >
            <MdClose size={24} />
          </IconButton>

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <img
              src={imagePath}
              alt={product.title}
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.2s ease",
                objectFit: "contain",
              }}
            />

            {imageKeys.length > 1 && (
              <>
                <Button
                  onClick={handleModalPrevImage}
                  style={{
                    position: "absolute",
                    left: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    minWidth: "40px",
                  }}
                >
                  ❮
                </Button>
                <Button
                  onClick={handleModalNextImage}
                  style={{
                    position: "absolute",
                    right: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    minWidth: "40px",
                  }}
                >
                  ❯
                </Button>
              </>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "16px",
              display: "flex",
              gap: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: "8px 12px",
              borderRadius: "8px",
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              style={{ color: "white" }}
            >
              <MdRemove size={20} />
            </IconButton>
            <Typography
              style={{
                color: "white",
                display: "flex",
                alignItems: "center",
                minWidth: "60px",
                justifyContent: "center",
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              style={{ color: "white" }}
            >
              <MdAdd size={20} />
            </IconButton>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ProductCard;
