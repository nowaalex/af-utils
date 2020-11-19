import { cloneElement, memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";
import css from "./style.module.scss";

import { WIDGET_SCROLL_HEIGHT } from "constants/events";

const HEIGHT_PROVIDER_SUBSCRIPTIONS = [ WIDGET_SCROLL_HEIGHT ];

const el = <div aria-hidden="true" className={css.wrapper} />;

const HeightProvider = () => cloneElement( el, {
    style: {
        height: useModelSubscription( HEIGHT_PROVIDER_SUBSCRIPTIONS ).widgetScrollHeight
    }
});

export default memo( HeightProvider, () => true );