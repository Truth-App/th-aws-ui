import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      console.log(action.payload);
      const productId = action.payload.id;
      const existingProductIndex = state.findIndex(
        (item) => item.id === productId,
      );
      if (existingProductIndex !== -1) {
        state[existingProductIndex].quantity += 1;
        console.log("cart store", state);
        return;
      } else {
        state.push({ ...action.payload, quantity: 1 });
      }
      console.log("cart store", state);
    },
    removeFromCart: (state, action) => {
      const productId = action.payload.id;
      const existingProductIndex = state.findIndex(
        (item) => item.id === productId,
      );
      if (existingProductIndex !== -1) {
        if (state[existingProductIndex].quantity > 1) {
          state[existingProductIndex].quantity -= 1;
        } else {
          state.splice(existingProductIndex, 1);
        }
      }
    },
    clearCart: () => {
      return [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
