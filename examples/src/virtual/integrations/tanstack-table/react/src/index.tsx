import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./code";

const container = document.getElementById("root");
if (!container) throw new Error("Example root element is missing");
createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>
);
