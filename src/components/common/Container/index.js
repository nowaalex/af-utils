import { useState, useEffect, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import cx from "utils/cx";
import {
    END_INDEX,
    ROWS_QUANTITY
} from "constants/events";
import { observe, unobserve } from "utils/heightObserver";
import HeightProvider from "./HeightProvider";
import VariableHeightsModel from "models/VariableSizeList";
import FixedHeightsModel from "models/FixedSizeList";
import css from "./style.module.scss";

const Container = ({
    rowsQuantity,
    children,
    as: Component,
    fixed,
    estimatedRowHeight,
    overscanRowsCount,
    dataRef,
    onRangeEndMove,
    className,
    ...props
}) => {
    
    const [ scrollNode, setScrollNode ] = useState( null );
    const [ model ] = useState(() => new ( fixed ? FixedHeightsModel : VariableHeightsModel ));

    useImperativeHandle( dataRef, () => model, []);

    useEffect(() => {
        if( scrollNode ){
            model.setScrollContainerNode( scrollNode );
            observe( scrollNode, model.setWidgetHeight );

            return () => unobserve( scrollNode );
        }
    }, [ scrollNode ]);

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

    useEffect(() => () => model.destructor(), []);

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

/* This object is used in documentation, do not remove */
Container.defaultProps = {
    as: "div",
    fixed: false,
    estimatedRowHeight: 20,
    overscanRowsCount: 2,
}

export default Container;