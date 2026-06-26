import { fetchAuthSession } from "aws-amplify/auth";

export const createOrder = async (cart, formData) => {
  console.log("createOrder called with:", { cart, formData });
  try {
    const products = cart.map((item) => ({
      id: item.id,
      price: item.customerPrice,
      quantity: item.quantity,
      subTotal: item.customerPrice * item.quantity,
      mrpPrice: item.mrpPrice,
    }));

    const total = products.reduce((sum, p) => sum + p.subTotal, 0);

    const user = {
      fullName: formData.fullName,
      phone: formData.phone,
      ...(formData.email && { email: formData.email }),
    };

    const shippingAddress = {
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      ...(formData.landmark && { landmark: formData.landmark }),
    };

    const payload = {
      products,
      amount: { total },
      user,
      shippingAddress,
    };

    console.log("Order payload:", JSON.stringify(payload));

    let accessToken = "";
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString() || "";
    } catch {
      accessToken = "";
    }

    const headers = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(
      "https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders",
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

export const verifyPayment = async (orderId, rzpPaymentId, rzpSignature) => {
  try {
    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/${orderId}/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rzpPaymentId, rzpSignature }),
      },
    );
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false };
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/${orderId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch order. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
};

export const getOrders = async (accessToken) => {
  try {
    const response = await fetch(
      "https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch orders. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};
