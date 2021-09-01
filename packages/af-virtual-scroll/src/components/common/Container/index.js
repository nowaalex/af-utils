import { useState, useCallback, useEffect, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import cx from "src/utils/cx";
import {
    END_INDEX,
    ROWS_QUANTITY
} from "src/constants/events";
import { observe, unobserve } from "src/utils/dimensionsObserver";
import HeightProvider from "./HeightProvider";
import VariableHeightsModel from "src/models/VariableSizeList";
import FixedHeightsModel from "src/models/FixedSizeList";
import css from "./style.module.scss";

const EMPTY_ARRAY = [];

const Container = ({
    rowsQuantity,
    children,
    as: Component = "div",
    fixed = false,
    estimatedRowHeight = 20,
    overscanRowsCount = 2,
    dataRef,
    onRangeEndMove,
    className,
    ...props
}) => {
    
    const [ model ] = useState(() => new ( fixed ? FixedHeightsModel : VariableHeightsModel ));

    useImperativeHandle( dataRef, () => model, EMPTY_ARRAY);

    const setScrollNode = useCallback( scrollNode => {
        if( model.scrollContainerNode ){
            unobserve( model.scrollContainerNode );
        }
        model.setScrollContainerNode( scrollNode );
        if( scrollNode ){
            observe( scrollNode, model.updateWidgetDimensions );
        }
    }, EMPTY_ARRAY);

    model.startBatch().setParams( estimatedRowHeight, overscanRowsCount, rowsQuantity );

    useEffect(() => {
        model.endBatch();
    });

    useEffect(() => {
        if( onRangeEndMove ){
            const evt = () => onRangeEndMove( model );
            evt();
            model.on( evt, ROWS_QUANTITY, END_INDEX );
            return () => model.off( evt, ROWS_QUANTITY, END_INDEX );
        }
    }, [ onRangeEndMove ]);

    useEffect(() => () => model.destructor(), EMPTY_ARRAY);

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
            ref={setScrollNode}
            onScroll={e => model.setScrollTop( e.target.scrollTop )}
        >
            <HeightProvider model={model} />
            {children( model )}
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
    onRangeEndMove: PropTypes.func,
}

export default Container;