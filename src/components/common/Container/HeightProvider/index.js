import useSubscription from "hooks/useSubscription";
import css from "./style.module.scss";
import { WIDGET_SCROLL_HEIGHT, WIDGET_EXTRA_STICKY_HEIGHT } from "constants/events";

const Events = [ WIDGET_SCROLL_HEIGHT, WIDGET_EXTRA_STICKY_HEIGHT ];

const HeightProvider = ({ model }) => useSubscription( model, API => (
    <div
        aria-hidden="true"
        className={css.wrapper}
        style={{ height: API.widgetScrollHeight + API.extraStickyHeight }}
    />
), Events );

export default HeightProvider;