import { render } from "react-dom";
import App from "./App";
import "normalize.css";

const appRoot = document.createElement( "div" );
document.body.appendChild( appRoot );

render( <App />, appRoot );