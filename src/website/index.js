import { render } from "react-dom";
import App from "./App";

import "normalize.css";
import "./style.scss";

const appRoot = document.createElement( "div" );
appRoot.id = "app_root";
document.body.appendChild( appRoot );

render( <App />, appRoot );