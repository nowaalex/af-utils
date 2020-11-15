import { useRef, useCallback, useEffect } from "react";
import cx from "utils/cx";
import useApi from "hooks/useApi";
import HeightProvider from "../HeightProvider";
import css from "./style.module.scss";

const ScrollContainer = ({
    className,
    children,
    onScroll,
    ...props
}) => {

    const ref = useRef();
    const API = useApi();

    const scrollHandler = useCallback( e => {
        const { scrollTop, scrollLeft } = e.target;
        API.merge({
            scrollLeft,
            scrollTop
        });
        if( onScroll ){
            onScroll( e );
        }
    }, [ onScroll ]);

    useEffect(() => {
        const el = ref.current;

        const R = new ResizeObserver( entries => {
            if( entries.length === 1 ){
                /*
                    using target.offsetWidth instead of contentRect.width, because we need border-box sizing, 
                    and { box: border-box } option does not work here
                */
                const { width, height } = entries[ 0 ].contentRect;

                API.merge({
                    widgetHeight: Math.round( height ),
                    widgetWidth: Math.round( width )
                });
            }
        });

        R.observe( el );

        return () => R.unobserve( el );
    }, []);
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <div tabIndex="0" className={cx(css.wrapper,className)} ref={ref} onScroll={scrollHandler} {...props}>
            <HeightProvider />
            {children}
        </div>
    );
};

export default ScrollContainer;