import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import productsReducer from './slices/productSlice'
import categoriesReducer from './slices/categorySlice'
import usersReducer from './slices/usersSlice'
import inventoryReducer from './slices/inventorySlice'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer,
    categories: categoriesReducer,
    users: usersReducer,
    inventory: inventoryReducer,
    user: userReducer,
  },
})