import { fetchAuthSession } from "aws-amplify/auth";

export const createOrder = async (cart, formData, isPaymentCOD = false) => {
  console.log("createOrder called with:", { cart, formData, isPaymentCOD });
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
      ...(isPaymentCOD && { isPaymentCOD: true }),
    };

    console.log("Order payload:", JSON.stringify(payload));

    let accessToken = "";
    let idToken = "";
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString() || "";
      idToken = session.tokens?.idToken?.toString() || "";
    } catch {
      accessToken = "";
      idToken = "";
    }

    const isAuthenticated = Boolean(accessToken && idToken);
    const headers = {
      "Content-Type": "application/json",
      ...(isAuthenticated
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
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

export const updateOrderApproval = async (orderId, approvalData) => {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString() || "";

    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/${orderId}/approval`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(approvalData),
      },
    );

    if (!response.ok) {
      let message = `Failed to update order approval. Status: ${response.status}`;

      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // Ignore parse errors and keep fallback message
      }

      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order approval:", error);
    throw error;
  }
};

export const updateOrderShipment = async (orderId, shipmentData) => {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString() || "";

    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/${orderId}/approval`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(shipmentData),
      },
    );

    if (!response.ok) {
      let message = `Failed to update order shipment. Status: ${response.status}`;

      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // Ignore parse errors and keep fallback message
      }

      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order shipment:", error);
    throw error;
  }
};

export const updateOrderDelivery = async (orderId, deliveryData) => {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString() || "";

    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/${orderId}/approval`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(deliveryData),
      },
    );

    if (!response.ok) {
      let message = `Failed to update order delivery. Status: ${response.status}`;

      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // Ignore parse errors and keep fallback message
      }

      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order delivery:", error);
    throw error;
  }
};

export const getProductStock = async (orderId) => {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString() || "";

    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/orders/inventory`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product stock. Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product stock:", error);
    return {};
  }
};

export const getInvoiceByOrderId = async (orderId) => {
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString() || "";

    const response = await fetch(
      `https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com/api/invoice?orderId=${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
    );

    if (!response.ok) {
      let message = `Failed to fetch invoice. Status: ${response.status}`;

      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // Ignore parse errors and keep fallback message
      }

      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw error;
  }
};
