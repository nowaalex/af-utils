import { createApp } from "vue";
import App from "./code.vue";

const container = document.getElementById("root");
if (!container) throw new Error("Example root element is missing");
createApp(App).mount(container);
