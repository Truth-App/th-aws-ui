import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdClose, MdAdd, MdRemove } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../store/slices/cartSlice";
import { useState } from "react";
import { getUserRoleFromList } from "../constants/dashboardFeatures";

const getEffectiveProductPrice = (product, userRole) => {
  const fallbackPrice = Number(product?.customerPrice || 0);

  if (!userRole) {
    return fallbackPrice;
  }

  let rolePriceKey = "";
  if (userRole === "Dealer") rolePriceKey = "dealerPrice";
  if (userRole === "Stockist") rolePriceKey = "stockistPrice";
  if (userRole === "Super Stockist") rolePriceKey = "superStockistPrice";

  if (!rolePriceKey) {
    return fallbackPrice;
  }

  const rolePrice = Number(product?.[rolePriceKey]);
  return Number.isFinite(rolePrice) && rolePrice > 0 ? rolePrice : fallbackPrice;
};

const ProductCard = ({ product, actionType = "cart", actionLabel = "Update Product", onAction }) => {
  const blinkitLikeFont = '"Nunito Sans", "Montserrat", "Segoe UI", sans-serif';
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.user.user);
  const users = useSelector((state) => state.users.items);
  const selector = useSelector((state) => state.cart);
  const cartProduct = selector.find((item) => item.id === product.id);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isMobile = useMediaQuery("(max-width:600px)");
  const shouldWrapActions = useMediaQuery("(max-width:430px)");

  const isUpdateMode = actionType === "update";
  const isInactive = product.isActive === false;
  const defaultImagePath = "/thriftyhomelogo.png";
  const imageKeys = product.imageKeys || product.fileKeys || [];
  const userRole = getUserRoleFromList(users, authUser?.email);
  console.log("[ProductCard] authUser.email:", authUser?.email, "| resolved role:", userRole || "(none — using customerPrice)");
  const effectivePrice = getEffectiveProductPrice(product, userRole);
  const hasDiscount = Number(product.mrpPrice) > Number(effectivePrice);
  const savedPercent = hasDiscount
    ? Math.round(((Number(product.mrpPrice) - Number(effectivePrice)) / Number(product.mrpPrice)) * 100)
    : 0;

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
          fontFamily: blinkitLikeFont,
        }}
      >
        <div
          style={{
            backgroundColor: "#f5f5f5",
            position: "relative",
            border: "1.2px solid #edf2ee",
            borderRadius: "10px 10px 0 0",
          }}
        >
          {hasDiscount && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                backgroundColor: "#2f80ed",
                color: "#fff",
                fontSize: isMobile ? "0.62rem" : "0.68rem",
                fontWeight: 700,
                fontFamily: blinkitLikeFont,
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
                  fontFamily: blinkitLikeFont,
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
              height: isMobile ? 102 : 122,
              width: "100%",
              objectFit: "contain",
              cursor: "pointer",
              backgroundColor: "#f5f5f5",
            }}
            src={imagePath}
            alt={product.title}
          />
        </div>

        <CardContent
          style={{
            flexGrow: 1,
            padding: isMobile ? "6px 10px" : "7px 11px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            gutterBottom={false}
            variant="h6"
            component="div"
            sx={{
              fontSize: isMobile ? "0.82rem" : "0.88rem",
              fontFamily: blinkitLikeFont,
              fontWeight: 700,
              margin: "0 0 0.2em 0",
              lineHeight: 1.15,
            }}
          >
            {product.title}
          </Typography>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: shouldWrapActions ? "stretch" : isMobile ? "center" : "flex-end",
              flexWrap: shouldWrapActions ? "wrap" : "nowrap",
              gap: shouldWrapActions ? "0.35em" : isMobile ? "0.12em" : "0.45em",
              marginTop: "auto",
              marginBottom: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                flex: shouldWrapActions ? "1 1 100%" : "1 1 60px",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "var(--brand-primary)",
                  fontSize: isMobile ? "0.75rem" : "1.04rem",
                  fontFamily: blinkitLikeFont,
                  fontWeight: 700,
                  lineHeight: 1.05,
                }}
              >
                ₹{effectivePrice}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#8a8a8a",
                  fontSize: isMobile ? "0.55rem" : "0.76rem",
                  fontFamily: blinkitLikeFont,
                  fontWeight: 600,
                  textDecoration: "line-through",
                  lineHeight: 1.05,
                }}
              >
                ₹{product.mrpPrice}
              </Typography>
            </div>

            {!isUpdateMode &&
              (cartProduct ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "0.1em" : "0.32em",
                    border: "1px solid #cfd8d2",
                    borderRadius: "999px",
                    padding: isMobile ? "0 2px" : "0 5px",
                    height: isMobile ? "28px" : "32px",
                    backgroundColor: "#f7faf8",
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
                      minWidth: isMobile ? "24px" : "28px",
                      width: isMobile ? "24px" : "28px",
                      height: isMobile ? "24px" : "28px",
                      borderRadius: "999px",
                      backgroundColor: "var(--brand-primary)",
                      color: "#fff",
                      boxShadow: "none",
                      fontWeight: 700,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: isMobile ? "1rem" : "1.15rem",
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      -
                    </span>
                  </Button>
                  <span
                    style={{
                      minWidth: "1.8ch",
                      textAlign: "center",
                      fontWeight: 700,
                      fontFamily: blinkitLikeFont,
                      color: "var(--brand-ink)",
                      fontSize: isMobile ? "0.7rem" : "0.88rem",
                    }}
                  >
                    {cartProduct.quantity}
                  </span>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={product.isActive === false}
                    onClick={() => {
                      dispatch(addToCart({ ...product, customerPrice: effectivePrice }));
                    }}
                    style={{
                      minWidth: isMobile ? "24px" : "28px",
                      width: isMobile ? "24px" : "28px",
                      height: isMobile ? "24px" : "28px",
                      borderRadius: "999px",
                      backgroundColor: "var(--brand-primary)",
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
                    <span
                      style={{
                        fontSize: isMobile ? "1rem" : "1.15rem",
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </span>
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    backgroundColor: "transparent",
                    height: isMobile ? "28px" : "32px",
                    flexShrink: 0,
                    marginLeft: "auto",
                    width: shouldWrapActions ? "100%" : "auto",
                  }}
                >
                  <Button
                    onClick={() => {
                      dispatch(addToCart({ ...product, customerPrice: effectivePrice }));
                    }}
                    disabled={product.isActive === false}
                    size="small"
                    variant="outlined"
                    style={{
                      color: "var(--brand-primary)",
                      borderColor: "var(--brand-primary)",
                      textTransform: "uppercase",
                      fontFamily: blinkitLikeFont,
                      letterSpacing: "0.02em",
                      fontWeight: 700,
                      borderRadius: "4px",
                      padding: isMobile ? "0 6px" : "0 14px",
                      minWidth: isMobile ? "40px" : "68px",
                      height: isMobile ? "26px" : "30px",
                      lineHeight: 1,
                      fontSize: isMobile ? "0.7rem" : "0.875rem",
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
                    Add
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>

        {isUpdateMode && (
          <CardActions
            style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "0px 12px 2px 12px" }}
          >
            <Button
              onClick={() => onAction?.(product)}
              size="small"
              variant="contained"
              style={{ backgroundColor: "var(--brand-primary)", textTransform: "none", fontWeight: "bold", fontFamily: blinkitLikeFont }}
            >
              {actionLabel}
            </Button>
          </CardActions>
        )}
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
