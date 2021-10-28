import { useState, useEffect, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import cx from "utils/cx";
import VariableHeightsModel from "models/VariableSizeList";
import FixedHeightsModel from "models/FixedSizeList";
import css from "./style.module.scss";

const EMPTY_ARRAY = [];

const Container = ({
    rowsQuantity,
    children,
    as: Component = "div",
    fixed = false,
    estimatedRowHeight = 20,
    overscanRowsCount = 3,
    dataRef,
    className,
    ...props
}) => {
    
    const [ model ] = useState(() => new ( fixed ? FixedHeightsModel : VariableHeightsModel ));

    model._startBatch();
    model._setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity );

    useEffect(() => {
        model._endBatch();
    });

    useEffect(() => () => model._destroy(), EMPTY_ARRAY);

    useImperativeHandle( dataRef, () => model, EMPTY_ARRAY);

    if( process.env.NODE_ENV !== "production" ){
        const AssumedConstructor = fixed ? FixedHeightsModel : VariableHeightsModel;
        if( !( model instanceof AssumedConstructor ) ){
            console.warn( `
                'fixed' prop is taken into account ONLY during initial component mount.
                All future changes are ignored. You must decide once.`
            );
        }
    }
    
    /*
        tabIndex="0" is for proper keyboard nav
        https://bugzilla.mozilla.org/show_bug.cgi?id=1346159
    */
    return (
        <Component
            {...props}
            tabIndex="0"
            className={cx(css.wrapper,className)}
            ref={model._setScrollContainerNode}
        >
            <div
                ref={model._setInnerNode}
                className={css.innerNode}
            >
                {children( model )}
            </div>
        </Component>
    );
};

Container.propTypes = {
    rowsQuantity: PropTypes.number.isRequired,
    Container: PropTypes.elementType,
    className: PropTypes.string,
    fixed: PropTypes.bool,
    overscanRowsCount: PropTypes.number,
    estimatedRowHeight: PropTypes.number,
}

export default Container;