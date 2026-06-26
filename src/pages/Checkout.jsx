import Navbar from "../components/Navbar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MdAdd, MdRemove, MdDelete } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { useState } from "react";
import { addToCart, removeFromCart, clearCart } from "../store/slices/cartSlice";
import loadRazorpay from "../helpers/razorpay";
import { createOrder, verifyPayment } from "../api/orders";

const Checkout = () => {
  const cart = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    phoneError: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      phone: value,
      phoneError: value && value.length !== 10 ? "Phone number must be 10 digits" : "",
    }));
  };

  const handlePlaceOrder = async () => {
    if (isProcessing) return;

    if (!formData.fullName.trim()) {
      alert("Please enter your full name");
      return;
    }
    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }
    if (!formData.address.trim()) {
      alert("Please enter your address");
      return;
    }
    if (!formData.city.trim()) {
      alert("Please enter your city");
      return;
    }
    if (!formData.pincode.trim()) {
      alert("Please enter your pincode");
      return;
    }

    setIsProcessing(true);

    try {
      setOrderLoading(true);
      const loaded = await loadRazorpay();
      if (!loaded) {
        setOrderLoading(false);
        setIsProcessing(false);
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }
      const orderResponse = await createOrder(cart, formData);
      setOrderLoading(false);
      if (!orderResponse || !orderResponse.orderId) {
        setIsProcessing(false);
        alert("Failed to place order.");
        return;
      }
      console.log("order api response", JSON.stringify(orderResponse));

      const options = {
        key: "rzp_test_T3m0sPls4a7PvD",
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "Thrifty Homes",
        order_id: orderResponse.paymentOrderId,
        handler: async function (response) {
          console.log("handler function response", response);
          setPaymentVerifying(true);

          try {
            const verifyPromise = verifyPayment(
              orderResponse.orderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Verification timeout")), 30000)
            );

            const result = await Promise.race([verifyPromise, timeoutPromise]);
            console.log("verify payment result", result);

            if (result.success) {
              document.body.style.overflow = "";
              dispatch(clearCart());
              navigate(`/order?orderId=${encodeURIComponent(orderResponse.orderId)}`);
            } else {
              console.log("Payment verification failed.");
              setPaymentVerifying(false);
              setIsProcessing(false);
              document.body.style.overflow = "";
              dispatch(clearCart());
              navigate(`/order?orderId=${encodeURIComponent(orderResponse.orderId)}`);
            }
          } catch (verificationError) {
            console.error("Error verifying payment:", verificationError);
            setPaymentVerifying(false);
            setIsProcessing(false);
            document.body.style.overflow = "";
            dispatch(clearCart());
            navigate(`/order?orderId=${encodeURIComponent(orderResponse.orderId)}`);
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: "#165d46",
        },
        modal: {
          ondismiss: function () {
            setPaymentVerifying(false);
            setIsProcessing(false);
            document.body.style.overflow = "";
            console.log("Payment modal dismissed by user.");
            dispatch(clearCart());
            navigate(`/order?orderId=${encodeURIComponent(orderResponse.orderId)}`);
          },
          onerror: function (error) {
            setPaymentVerifying(false);
            setIsProcessing(false);
            document.body.style.overflow = "";
            console.error("Razorpay error:", error);
            dispatch(clearCart());
            navigate(`/order?orderId=${encodeURIComponent(orderResponse.orderId)}`);
          },
        },
      };

      try {
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (razorpayError) {
        console.error("Error opening Razorpay modal:", razorpayError);
        setOrderLoading(false);
        setIsProcessing(false);
        alert("Failed to open payment modal. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderLoading(false);
      setIsProcessing(false);
      alert("Failed to place order.");
    }
  };

  const getImageUrl = (item) => {
    const imageKeys = item.imageKeys || item.fileKeys || [];
    if (imageKeys.length > 0) {
      return `https://th-app-product.s3.ap-south-2.amazonaws.com/${imageKeys[0]}`;
    }
    return "/thriftyhomelogo.png";
  };

  const handleRemoveCompletely = (item) => {
    for (let i = 0; i < item.quantity; i++) {
      dispatch(removeFromCart(item));
    }
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px",
          height: "calc(100vh - 100px)",
          overflow: "auto",
          boxSizing: "border-box",
        }}
      >
        <Card
          variant="outlined"
          style={{
            flex: "1 1 55%",
            minWidth: "300px",
            maxHeight: "100%",
            overflowY: "auto",
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography variant="h5" style={{ fontWeight: 600, marginBottom: "4px", textAlign: "center" }}>
              Order Summary
            </Typography>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              <Typography variant="body2" color="text.secondary">
                Forgot to add something?
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => navigate("/")}
                style={{ textTransform: "none", color: "#165d46", fontWeight: 600 }}
              >
                Continue Shopping
              </Button>
            </div>
            {cart.length === 0 ? (
              <Typography color="text.secondary" style={{ textAlign: "center" }}>Your cart is empty.</Typography>
            ) : (
              cart.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    padding: "12px",
                    marginBottom: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <img
                    src={getImageUrl(item)}
                    alt={item.title}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      borderRadius: "6px",
                      backgroundColor: "#f5f5f5",
                      marginRight: "12px",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <Typography variant="body1" style={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Typography variant="body2" style={{ fontWeight: 700 }}>
                        ₹{item.customerPrice}
                      </Typography>
                      <Typography variant="body2" style={{ textDecoration: "line-through", color: "#999" }}>
                        ₹{item.mrpPrice}
                      </Typography>
                      {item.mrpPrice > item.customerPrice && (
                        <Typography variant="caption" style={{ color: "#2e7d32", fontWeight: 600 }}>
                          {Math.round(((item.mrpPrice - item.customerPrice) / item.mrpPrice) * 100)}% off
                        </Typography>
                      )}
                    </div>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity} • Subtotal: ₹{item.customerPrice * item.quantity}
                    </Typography>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "4px" : "8px", marginTop: "8px", width: "auto", marginLeft: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.15em" : "0.4em", border: "1px solid #cfd8d2", borderRadius: "999px", padding: isMobile ? "0.1em 0.15em" : "0.2em 0.35em", backgroundColor: "#f7faf8" }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => dispatch(removeFromCart(item))}
                        style={{
                          minWidth: "30px",
                          width: "30px",
                          height: "30px",
                          borderRadius: "999px",
                          backgroundColor: "#e8efeb",
                          color: "#165d46",
                          boxShadow: "none",
                          fontWeight: 700,
                        }}
                      >
                        <MdRemove size={16} />
                      </Button>
                      <span style={{ minWidth: "2.2ch", textAlign: "center", fontWeight: 700, color: "#1f3d31", fontSize: "0.95rem" }}>
                        {item.quantity}
                      </span>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => dispatch(addToCart(item))}
                        style={{
                          minWidth: "30px",
                          width: "30px",
                          height: "30px",
                          borderRadius: "999px",
                          backgroundColor: "#165d46",
                          color: "#fff",
                          boxShadow: "none",
                          fontWeight: 700,
                        }}
                      >
                        <MdAdd size={16} />
                      </Button>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveCompletely(item)}
                      style={{ color: "#e53935", padding: "4px" }}
                    >
                      <MdDelete size={16} />
                    </IconButton>
                  </div>
                </Card>
              ))
            )}
            {cart.length > 0 && (
              <div style={{ borderTop: "1px solid #e0e0e0", marginTop: "16px", paddingTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <Typography variant="body2" style={{ color: "#999" }}>MRP Total</Typography>
                  <Typography variant="body2" style={{ textDecoration: "line-through", color: "#999" }}>
                    ₹{cart.reduce((sum, item) => sum + item.mrpPrice * item.quantity, 0)}
                  </Typography>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <Typography variant="body1" style={{ fontWeight: 700 }}>Our Price</Typography>
                  <Typography variant="body1" style={{ fontWeight: 700 }}>
                    ₹{cart.reduce((sum, item) => sum + item.customerPrice * item.quantity, 0)}
                  </Typography>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" style={{ color: "#2e7d32", fontWeight: 600 }}>You save</Typography>
                  <Typography variant="body2" style={{ color: "#2e7d32", fontWeight: 600 }}>
                    {Math.round((cart.reduce((sum, item) => sum + (item.mrpPrice - item.customerPrice) * item.quantity, 0) / cart.reduce((sum, item) => sum + item.mrpPrice * item.quantity, 0)) * 100)}% • ₹{cart.reduce((sum, item) => sum + (item.mrpPrice - item.customerPrice) * item.quantity, 0)}
                  </Typography>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card
          variant="outlined"
          style={{
            flex: "1 1 35%",
            minWidth: "280px",
            maxHeight: "100%",
            overflowY: "auto",
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography variant="h5" style={{ fontWeight: 600, textAlign: "center" }}>
              Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary" style={{ textAlign: "center", marginTop: "8px", marginBottom: "16px" }}>
              Provide your delivery details and choose a payment mode.
            </Typography>
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              fullWidth
              size="small"
              style={{ marginBottom: "12px" }}
              required
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={handlePhoneChange}
              fullWidth
              size="small"
              placeholder="+91"
              error={!!formData.phoneError}
              helperText={formData.phoneError}
              inputProps={{ maxLength: 10 }}
              style={{ marginBottom: "12px" }}
              required
            />
            <TextField
              label="Email (optional)"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              fullWidth
              size="small"
              type="email"
              style={{ marginBottom: "12px" }}
            />
            <TextField
              label="Address Line"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
              style={{ marginBottom: "12px" }}
              required
            />
            <TextField
              label="Landmark (optional)"
              value={formData.landmark}
              onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
              fullWidth
              size="small"
              style={{ marginBottom: "12px" }}
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              fullWidth
              size="small"
              style={{ marginBottom: "12px" }}
              required
            />
            <TextField
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              fullWidth
              size="small"
              inputProps={{ maxLength: 6 }}
              style={{ marginBottom: "16px" }}
              required
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || orderLoading || paymentVerifying || isProcessing}
              style={{
                backgroundColor: cart.length === 0 || orderLoading || paymentVerifying || isProcessing ? undefined : "#165d46",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              Place Order
            </Button>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={orderLoading || paymentVerifying}
        PaperProps={{ style: { padding: "24px 32px", textAlign: "center", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }}
      >
        <CircularProgress style={{ color: "#165d46", marginBottom: "12px" }} />
        <Typography variant="body1" style={{ fontWeight: 600 }}>
          {paymentVerifying ? "Confirming payment. Do not close this window..." : "Placing your order..."}
        </Typography>
      </Dialog>
    </>
  );
};

export default Checkout;
