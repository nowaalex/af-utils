import { cloneElement, memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";
import css from "./style.module.scss";

import { VIRTUAL_TOP_OFFSET } from "constants/events";

const SCROLLER_SUBSCRIPTIONS = [ VIRTUAL_TOP_OFFSET ];

const Scroller = ({ as: Component }) => {

    const { virtualTopOffset } = useModelSubscription( SCROLLER_SUBSCRIPTIONS );

    /*
        Hmm, I can't put here more than ~ 3 000 000. Maybe need to put one more row in case this height is > 3 000 000
    */
    return cloneElement( Component, {
        className: css.wrapper,
        "aria-hidden": "true",
        style: { height: virtualTopOffset }
    });
}

export default memo( Scroller );