import React from "react";
import { render } from "react-dom";
import App from "./App";

const rootNode = document.createElement( "div" );
document.body.appendChild( rootNode );

render( <App />, rootNode );