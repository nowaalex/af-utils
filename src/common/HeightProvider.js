import React, { cloneElement, memo } from "react";
import useApi from "../useApi";

const SUBSCRIBE_EVENTS = [ "#widgetScrollHeight" ];

const el = <div aria-hidden="true" className="afvscr-height-provider" />;

const HeightProvider = () => {

    const { widgetScrollHeight: height } = useApi( SUBSCRIBE_EVENTS );

    const props = {
        style: {
            height
        }
    };

    return cloneElement( el, props );
};

export default memo( HeightProvider );