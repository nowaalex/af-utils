import { render } from "preact";
import App from "./code";

const container = document.getElementById("root");

if (!container) {
    throw new Error("Example root element is missing");
}

render(<App />, container);
