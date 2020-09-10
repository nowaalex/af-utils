import React from "react";
import { addDecorator } from "@storybook/react";

addDecorator( storyFn => <div style={{ display: "flex", height: "70vh" }}>{storyFn()}</div>);