import "mobx-react-lite/batchingForReactDom";
import { ResizeObserver as ResizeObserverPolyfill } from "@juggle/resize-observer";
import React from "react";
import { render } from "react-dom";
import App from "./App";

import "normalize.css";
import "af-virtual-scroll/lib/style.css";

if( !window.ResizeObserver ){
    window.ResizeObserver = ResizeObserverPolyfill;
}

const rootNode = document.createElement( "div" );
rootNode.id = "root";
document.body.appendChild( rootNode );

render( <App />, rootNode );