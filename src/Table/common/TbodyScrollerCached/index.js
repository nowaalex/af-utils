import React, { cloneElement } from "react";
import useApiPlugin from "../../../useApi";

const SUBSCRIBE_EVENTS = [ "#virtualTopOffset" ];

const tr = <tr />;

const Tr = () => {

    const { virtualTopOffset } = useApiPlugin( SUBSCRIBE_EVENTS );

    const props = {
        style: {
            height: virtualTopOffset
        }
    };

    return cloneElement( tr, props );
};

/*
    According to specs, tr must always be inside tbody, thead or tfoot
                
    Hmm, I can't put here more than ~ 3 000 000. Maybe need to put one more tr in case this height is > 3 000 000
*/
const CachedTbodyScroller = (
    <tbody style={{ visibility: "hidden" }}>
        <Tr />
    </tbody>
);

export default CachedTbodyScroller;