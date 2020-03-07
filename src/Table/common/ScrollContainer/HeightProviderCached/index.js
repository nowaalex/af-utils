import React, { cloneElement } from "react";
import { css } from "emotion";
import useApi from "../../../../useApi";

const SUBSCRIBE_EVENTS = [
    "#widgetScrollHeight"
];

const heightProviderClass = css`
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
    width: 1px;
`;

const el = <div className={heightProviderClass} />;

const HeightProvider = () => {

    const { widgetScrollHeight: height } = useApi( SUBSCRIBE_EVENTS );

    const props = {
        style: {
            height
        }
    };

    return cloneElement( el, props );
};

const HeightProviderCached = <HeightProvider />;

export default HeightProviderCached;