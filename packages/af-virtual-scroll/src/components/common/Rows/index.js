import useSubscription from "hooks/useSubscription";
import { EVT_RANGE } from "constants/events";
import css from "./style.module.scss";

const Events = [ EVT_RANGE ];

const spacerKey = Date.now().toString(36);

const Rows = ({ model, children, Spacer = "div", ...rest }) => useSubscription(
    model, 
    ({ from, to, virtualTopOffset, setSpacerNode }) => {
        
        const result = [
            <Spacer
                key={spacerKey}
                className={css.spacer}
                aria-hidden="true"
                style={{ height: virtualTopOffset}}
                ref={setSpacerNode}
            />
        ];    
        
        for( let i = from; i < to; i++ ){
            result.push(children( i, rest ));
        }

        return result;
    },
    Events
);

export default Rows;