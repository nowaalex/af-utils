import React, { memo } from "react";
import useApiPlugin from "../useApi";

const SUBSCRIBE_EVENTS = [ "#virtualTopOffset" ];

const Scroller = ({ Component }) => {

    const { virtualTopOffset } = useApiPlugin( SUBSCRIBE_EVENTS );
    /*
        Hmm, I can't put here more than ~ 3 000 000. Maybe need to put one more row in case this height is > 3 000 000
    */
    return <Component className="afvscr-scroller" aria-hidden="true" style={{ height: virtualTopOffset }} />;
};

export default memo( Scroller );