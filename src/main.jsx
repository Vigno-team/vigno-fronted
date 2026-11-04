import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./paletaVigno.css";
import "./configuracionGlobal.css";

import { AuthProvider } from "./contexto/AuthContext.jsx";
import { ConfiguracionProvider } from "./contexto/ConfiguracionContext.jsx";
import { AppRouter } from "./routes/AppRoutes.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ConfiguracionProvider>
        <AppRouter />
      </ConfiguracionProvider>
    </AuthProvider>
  </StrictMode>
);