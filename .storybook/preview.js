import React from "react";
import "normalize.css";
import "../src/style.css";
import "mobx-react-lite/batchingForReactDom";
import { addDecorator } from "@storybook/react";

addDecorator( storyFn => <div style={{ display: "flex", height: "70vh" }}>{storyFn()}</div>);