import React from "react";
import useApi from "../useApi";
import { observer } from "mobx-react-lite";

const Scroller = ({ Component }) => {

    const { virtualTopOffset } = useApi();

    /*
        Hmm, I can't put here more than ~ 3 000 000. Maybe need to put one more row in case this height is > 3 000 000
    */
    return <Component className="afvscr-scroller" aria-hidden="true" style={{ height: virtualTopOffset }} />;
};

export default observer( Scroller );