import { cloneElement, memo } from "react";
import useModelSubscription from "hooks/useModelSubscription";
import css from "./style.module.scss";

const HEIGHT_PROVIDER_SUBSCRIPTIONS = [ "widgetScrollHeight" ];

const el = <div aria-hidden="true" className={css.wrapper} />;

const HeightProvider = () => cloneElement( el, {
    style: {
        height: useModelSubscription( HEIGHT_PROVIDER_SUBSCRIPTIONS ).widgetScrollHeight
    }
});

export default memo( HeightProvider, () => true );