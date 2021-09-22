import { Fragment } from "react";
import useSubscription from "hooks/useSubscription";
import { EVT_RANGE } from "constants/events";
import css from "./style.module.scss";

const Events = [ EVT_RANGE ];

const VisibleRows = ({ m: model, r: renderRow, e: extraProps }) => useSubscription(
    model, 
    ({ from, to }) => {
        const result = [];    
        
        for( let i = from; i < to; i++ ){
            result.push(renderRow( i, extraProps ));
        }

        return result;
    },
    Events
);

const Rows = ({ model, children, Spacer = "div", ...rest }) => (
    <Fragment>
        <Spacer
            className={css.spacer}
            aria-hidden="true"
            ref={model._setSpacerNode}
        />
        <VisibleRows
            m={model}
            r={children}
            e={rest}
        />
    </Fragment>
);


export default Rows;