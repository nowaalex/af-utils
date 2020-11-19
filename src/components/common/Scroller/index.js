import css from "./style.module.scss";
import useSubscription from "hooks/useSubscription";
import { VIRTUAL_TOP_OFFSET } from "constants/events";

const E = [ VIRTUAL_TOP_OFFSET ];

/*
    Hmm, I can't put here more than ~ 3 000 000. Maybe need to put one more row in case this height is > 3 000 000
*/
const Scroller = ({ as: Component }) => useSubscription( API => (
    <Component
        className={css.wrapper}
        aria-hidden="true"
        style={{ height: API.virtualTopOffset }}
    />
), E );

export default Scroller;