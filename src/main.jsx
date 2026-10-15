import{StrictMode}from"react";
import{createRoot}from"react-dom/client";

import"./index.css";
import"./paletaVigno.css";
import"./configuracionGlobal.css";

import App from"./App.jsx";

import{
  ConfiguracionProvider
}from"./contexto/ConfiguracionContext.jsx";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <ConfiguracionProvider>
      <App/>
    </ConfiguracionProvider>
  </StrictMode>
);