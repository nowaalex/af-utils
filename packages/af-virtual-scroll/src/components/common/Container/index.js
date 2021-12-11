import { useImperativeHandle } from "react";
import PropTypes from "prop-types";
import cx from "utils/cx";
import useVirtual from "hooks/useVirtual";
import css from "./style.module.scss";

const EMPTY_ARRAY = [];

const Container = ({
    itemCount,
    children,
    as: Component = "div",
    fixed = false,
    estimatedItemSize = 20,
    overscanCount = 3,
    dataRef,
    className,
    ...props
}) => {
    
    const model = useVirtual({
        fixed,
        itemCount,
        estimatedItemSize,
        overscanCount
    });

    useImperativeHandle( dataRef, () => model, EMPTY_ARRAY);
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <Component
            {...props}
            tabIndex="0"
            className={cx(css.wrapper,className)}
            ref={model.setOuterNode}
        >
            <div
                ref={model.setInnerNode}
                className={css.innerNode}
            >
                {children( model )}
            </div>
        </Component>
    );
};

Container.propTypes = {
    itemCount: PropTypes.number.isRequired,
    Container: PropTypes.elementType,
    className: PropTypes.string,
    fixed: PropTypes.bool,
    overscanCount: PropTypes.number,
    estimatedItemSize: PropTypes.number,
}

export default Container;