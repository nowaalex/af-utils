import useSubscription from "hooks/useSubscription";
import css from "./style.module.scss";
import { WIDGET_SCROLL_HEIGHT } from "constants/events";

const E = [ WIDGET_SCROLL_HEIGHT ];

const HeightProvider = () => useSubscription( API => (
    <div
        className={css.wrapper}
        style={{ height: API.widgetScrollHeight }}
    />
), E );

export default HeightProvider