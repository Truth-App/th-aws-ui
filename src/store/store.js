import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import productsReducer from './slices/productSlice'
import categoriesReducer from './slices/categorySlice'
import usersReducer from './slices/usersSlice'
import inventoryReducer from './slices/inventorySlice'
import userReducer from './slices/userSlice'
import categoriesReducer from './slices/categorySlice'
import usersReducer from './slices/usersSlice'
import inventoryReducer from './slices/inventorySlice'

const createNoopStorage = () => ({
  getItem: () => Promise.resolve(null),
  setItem: (_key, value) => Promise.resolve(value),
  removeItem: () => Promise.resolve(),
})

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart'],
}

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productsReducer,
  user: userReducer,
  categories: categoriesReducer,
  users: usersReducer,
  inventory: inventoryReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

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