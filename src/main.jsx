//import { StrictMode } from 'react'
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthInitializer from "./components/AuthInitializer.jsx";
import { store } from "./store/store";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "./pages/Dashboard.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";
import CategoryManagement from "./pages/CategoryManagement.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";

import "./helpers/amplify-config";

createRoot(document.getElementById("root")).render(
  //<StrictMode>

  <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <AuthInitializer>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order" element={<OrderSuccess />} />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <CategoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthInitializer>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </ErrorBoundary>,
  //</StrictMode>,
);
