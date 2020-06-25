import "normalize.css";
import "../src/style.css";
import { addDecorator } from '@storybook/react';

addDecorator( storyFn => <div style={{ display: "flex", height: "70vh" }}>{storyFn()}</div>);