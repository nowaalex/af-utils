import { mount } from "svelte";
import App from "./code.svelte";

const container = document.getElementById("root");
if (!container) throw new Error("Example root element is missing");
mount(App, { target: container });
