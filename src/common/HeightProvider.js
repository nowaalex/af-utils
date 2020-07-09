import React, { cloneElement } from "react";
import useApi from "../useApi";
import { observer } from "mobx-react-lite";

const el = <div aria-hidden="true" className="afvscr-height-provider" />;

const HeightProvider = () => cloneElement( el, {
    style: {
        height: useApi().widgetScrollHeight
    }
});

export default observer( HeightProvider );