import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdClose, MdAdd, MdRemove } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../store/slices/cartSlice";
import { useState } from "react";

const getProductUnitLabel = (product) => {
  const raw =
    product?.unit ||
    product?.packSize ||
    product?.quantityLabel ||
    product?.size ||
    "";
  if (raw) return String(raw);

  const title = product?.title || "";
  const match = title.match(/(\d+(?:\.\d+)?\s?(?:ml|l|g|kg|pcs?|pack|pcs))/i);
  return match ? match[1].replace(/\s+/g, " ") : "1 pc";
};

const ProductCard = ({ product, actionType = "cart", actionLabel = "Update", onAction }) => {
  const dispatch = useDispatch();
  const selector = useSelector((state) => state.cart);
  const cartProduct = selector.find((item) => item.id === product.id);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isMobile = useMediaQuery("(max-width:600px)");

  const isUpdateMode = actionType === "update";
  const isInactive = product.isActive === false;
  const defaultImagePath = "/thriftyhomelogo.png";
  const imageKeys = product.imageKeys || product.fileKeys || [];
  const hasDiscount = Number(product.mrpPrice) > Number(product.customerPrice);
  const savedPercent = hasDiscount
    ? Math.round(((Number(product.mrpPrice) - Number(product.customerPrice)) / Number(product.mrpPrice)) * 100)
    : 0;
  const unitLabel = getProductUnitLabel(product);

  let imagePath = defaultImagePath;
  if (imageKeys.length > 0) {
    imagePath = `https://th-app-product.s3.ap-south-2.amazonaws.com/${imageKeys[0]}`;
  }

  const zoomImagePath =
    imageKeys.length > 0
      ? `https://th-app-product.s3.ap-south-2.amazonaws.com/${imageKeys[zoomImageIndex]}`
      : defaultImagePath;

  const handleImageClick = () => {
    setZoomModalOpen(true);
    setZoomImageIndex(0);
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

  const handleZoomPrevImage = () => {
    if (imageKeys.length <= 1) return;
    setZoomImageIndex((prev) => (prev === 0 ? imageKeys.length - 1 : prev - 1));
  };

  const handleZoomNextImage = () => {
    if (imageKeys.length <= 1) return;
    setZoomImageIndex((prev) => (prev === imageKeys.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <Card
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          border: "1px solid #e8e8e8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            position: "relative",
          }}
        >
          {hasDiscount && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                backgroundColor: "#2563eb",
                color: "#fff",
                fontSize: isMobile ? "0.62rem" : "0.68rem",
                fontWeight: 700,
                borderRadius: "0",
                padding: isMobile ? "3px 4px 5px 4px" : "4px 6px 6px 6px",
                lineHeight: 1.05,
                zIndex: 1,
                textAlign: "center",
                minWidth: isMobile ? "28px" : "34px",
                minHeight: isMobile ? "30px" : "34px",
                clipPath:
                  "polygon(0 0, 100% 0, 100% 83%, 92% 76%, 84% 83%, 76% 76%, 68% 83%, 60% 76%, 52% 83%, 44% 76%, 36% 83%, 28% 76%, 20% 83%, 12% 76%, 4% 83%, 0 76%)",
              }}
            >
              <span style={{ display: "block" }}>{savedPercent}%</span>
              <span style={{ display: "block", textTransform: "uppercase" }}>off</span>
            </div>
          )}

          {isInactive && isUpdateMode && (
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
                }}
              />
            </div>
          )}

          {isInactive && !isUpdateMode && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                pointerEvents: "none",
                backgroundColor: "rgba(0, 0, 0, 0.32)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  textAlign: "center",
                  backgroundColor: "transparent",
                  padding: 0,
                  margin: 0,
                }}
              >
                Out of Stock
              </Typography>
            </div>
          )}

          <CardMedia
            component="img"
            onClick={handleImageClick}
            sx={{
              height: isMobile ? 120 : 140,
              width: "100%",
              objectFit: "contain",
              cursor: "pointer",
              backgroundColor: "#ffffff",
              padding: "10px",
            }}
            src={imagePath}
            alt={product.title}
          />
        </div>

        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.3em",
            padding: isMobile ? "8px 10px 10px !important" : "10px 12px 12px !important",
            "&:last-child": {
              paddingBottom: isMobile ? "10px !important" : "12px !important",
            },
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: isMobile ? "0.8rem" : "0.88rem",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: isMobile ? "2em" : "2.2em",
            }}
          >
            {product.title}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "#8a8a8a",
              fontSize: isMobile ? "0.68rem" : "0.74rem",
              lineHeight: 1.2,
            }}
          >
            {unitLabel}
          </Typography>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              marginTop: "auto",
              paddingTop: "0.4em",
              width: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                flex: "1 1 0",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Typography
                sx={{
                  color: "#1a1a1a",
                  fontSize: isMobile ? "0.82rem" : "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ₹{product.customerPrice}
              </Typography>
              {hasDiscount && (
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    color: "#8a8a8a",
                    fontSize: isMobile ? "0.6rem" : "0.68rem",
                    textDecoration: "line-through",
                    lineHeight: 1.2,
                    marginTop: "1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ₹{product.mrpPrice}
                </Typography>
              )}
            </div>

            {isUpdateMode ? (
              <Button
                onClick={() => onAction?.(product)}
                size="small"
                variant="contained"
                style={{
                  backgroundColor: "#0c831f",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "6px",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {actionLabel}
              </Button>
            ) : cartProduct ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "0.1em" : "0.32em",
                  border: "1px solid #0c831f",
                  borderRadius: "6px",
                  padding: isMobile ? "0 2px" : "0 4px",
                  height: isMobile ? "28px" : "30px",
                  backgroundColor: "#f0fdf4",
                  flexShrink: 0,
                  marginLeft: "auto",
                }}
              >
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    dispatch(removeFromCart(product));
                  }}
                  style={{
                    minWidth: isMobile ? "24px" : "26px",
                    width: isMobile ? "24px" : "26px",
                    height: isMobile ? "24px" : "26px",
                    borderRadius: "4px",
                    backgroundColor: "#e8efeb",
                    color: "#0c831f",
                    boxShadow: "none",
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  -
                </Button>
                <span
                  style={{
                    minWidth: "1.8ch",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#1f3d31",
                    fontSize: isMobile ? "0.7rem" : "0.82rem",
                  }}
                >
                  {cartProduct.quantity}
                </span>
                <Button
                  size="small"
                  variant="contained"
                  disabled={product.isActive === false}
                  onClick={() => {
                    dispatch(addToCart(product));
                  }}
                  style={{
                    minWidth: isMobile ? "24px" : "26px",
                    width: isMobile ? "24px" : "26px",
                    height: isMobile ? "24px" : "26px",
                    borderRadius: "4px",
                    backgroundColor: "#0c831f",
                    color: "#fff",
                    boxShadow: "none",
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: 0,
                    ...(product.isActive === false
                      ? {
                          backgroundColor: "#e0e0e0",
                          color: "#9e9e9e",
                        }
                      : {}),
                  }}
                  sx={{
                    "&.Mui-disabled": {
                      backgroundColor: "#e0e0e0",
                      color: "#9e9e9e",
                    },
                  }}
                >
                  +
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  dispatch(addToCart(product));
                }}
                disabled={product.isActive === false}
                size="small"
                variant="outlined"
                style={{
                  color: "#0c831f",
                  borderColor: "#0c831f",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  borderRadius: "6px",
                  padding: isMobile ? "0 6px" : "0 10px",
                  minWidth: isMobile ? "44px" : "54px",
                  width: "auto",
                  height: isMobile ? "28px" : "30px",
                  lineHeight: 1,
                  fontSize: isMobile ? "0.68rem" : "0.78rem",
                  flexShrink: 0,
                  marginLeft: "auto",
                  boxSizing: "border-box",
                  ...(product.isActive === false
                    ? {
                        backgroundColor: "transparent",
                        color: "#9e9e9e",
                        borderColor: "#d0d0d0",
                      }
                    : {}),
                }}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "transparent",
                    color: "#9e9e9e",
                    borderColor: "#d0d0d0",
                  },
                }}
              >
                ADD
              </Button>
            )}
          </div>
        </CardContent>
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
              src={zoomImagePath}
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
                  onClick={handleZoomPrevImage}
                  style={{
                    position: "absolute",
                    left: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                    color: "white",
                    minWidth: "40px",
                  }}
                >
                  ❮
                </Button>
                <Button
                  onClick={handleZoomNextImage}
                  style={{
                    position: "absolute",
                    right: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
            <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 1} style={{ color: "white" }}>
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
            <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3} style={{ color: "white" }}>
              <MdAdd size={20} />
            </IconButton>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ProductCard;
