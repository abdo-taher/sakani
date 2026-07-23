import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./app.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,

          style: {
            borderRadius: "14px",
            fontWeight: "600",
            fontFamily: "Cairo",
          },

          success: {
            style: {
              background: "#2F7A4D",
              color: "#fff",
            },
          },

          error: {
            style: {
              background: "#B42318",
              color: "#fff",
            },
          },
        }}
      />

      <App />

    </BrowserRouter>
  </React.StrictMode>
);