import useSubscription from "hooks/useSubscription";
import css from "./style.module.scss";

const VisibleRows = ({ m: model, r: renderRow, e: extraProps }) => useSubscription(
    model, 
    ({ from, to }) => {
        const result = [];
        
        for( let i = from; i < to; i++ ){
            result.push(renderRow( i, extraProps ));
        }

        return result;
    }
);

const Rows = ({ model, children, Spacer = "div", ...rest }) => (
    <>
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
    </>
);


export default Rows;