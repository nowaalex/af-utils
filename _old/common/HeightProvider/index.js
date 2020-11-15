import React, { cloneElement } from "react";
import useApi from "../../useApi";
import { observer } from "mobx-react-lite";
import css from "./style.module.scss";

const el = <div aria-hidden="true" className={css.wrapper} />;

const HeightProvider = () => cloneElement( el, {
    style: {
        height: useApi().widgetScrollHeight
    }
});

export default observer( HeightProvider );