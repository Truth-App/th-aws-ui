import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdShoppingCart } from "react-icons/md";

const CartFloater = () => {
  const cart = useSelector((state) => state.cart);
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();

  if (cart.length === 0) return null;

  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalMrp = cart.reduce((sum, item) => sum + item.mrpPrice * item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.customerPrice * item.quantity, 0);
  const discount = totalMrp - totalPrice;

  return (
    <div
      style={{
        position: "fixed",
        bottom: isMobile ? "8px" : "16px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#fff8e1",
        border: "1px solid var(--brand-primary)",
        borderRadius: "12px",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
        padding: isMobile ? "8px 14px" : "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1300,
        maxWidth: "500px",
        width: isMobile ? "90%" : "90%",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", minWidth: 0 }}>
        <MdShoppingCart size={isMobile ? 20 : 24} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Typography variant="body2" style={{ fontWeight: 600, fontSize: isMobile ? "0.75rem" : "0.875rem", color: "var(--brand-primary)" }}>
            {itemsCount} item{itemsCount > 1 ? "s" : ""} in cart
          </Typography>
          <div style={{ display: "flex", gap: isMobile ? "4px" : "8px", alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
              ₹{totalPrice}
            </Typography>
            {discount > 0 && (
              <>
                <Typography
                  variant="caption"
                  style={{ textDecoration: "line-through", color: "#999", fontSize: isMobile ? "0.65rem" : "0.75rem" }}
                >
                  ₹{totalMrp}
                </Typography>
                <Typography variant="caption" style={{ color: "#e53935", fontWeight: 600, fontSize: isMobile ? "0.65rem" : "0.75rem" }}>
                  Save ₹{discount}
                </Typography>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="contained"
        onClick={() => navigate("/checkout")}
        style={{
          backgroundColor: "var(--brand-primary)",
          color: "#fff",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
          padding: isMobile ? "6px 14px" : "8px 24px",
          fontSize: isMobile ? "0.75rem" : "0.875rem",
          flexShrink: 0,
        }}
      >
        Checkout
      </Button>
    </div>
  );
};

export default CartFloater;
