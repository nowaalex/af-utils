import { render } from "react-dom";
import App from "./App";

import "normalize.css";
import "af-virtual-scroll/lib/style.css";
import "af-react-table/lib/style.css";

const appRoot = document.createElement( "div" );
appRoot.id = "app_root";
document.body.appendChild( appRoot );

render( <App />, appRoot );