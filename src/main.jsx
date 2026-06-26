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

import "./helpers/amplify-config";

createRoot(document.getElementById("root")).render(
  //<StrictMode>

  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>        
          <Routes>
            <Route path="/" element={<App />} />
            <Route
              path="/dashboard"
              element={
                  <Dashboard />                
              }
            />
          </Routes>        
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>,
  //</StrictMode>,
);
