import { useRef, useEffect } from "react";
import cx from "utils/cx";
import { observe, unobserve } from "utils/heightObserver";
import useApi from "hooks/useApi";
import HeightProvider from "../HeightProvider";
import css from "./style.module.scss";

const ScrollContainer = ({ className, children, ...props }) => {

    const ref = useRef();
    const API = useApi();

    useEffect(() => {
        const el = ref.current;

        API.setScrollContainerNode( el );

        observe( el, height => API.setWidgetHeight( height ) );

        return () => unobserve( el );
    }, []);
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <div
            {...props}
            tabIndex="0"
            className={cx(css.wrapper,className)}
            ref={ref}
            onScroll={e => API.setScrollTop( e.target.scrollTop )}
        >
            <HeightProvider />
            {children}
        </div>
    );
};

export default ScrollContainer;