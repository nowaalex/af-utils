import useSubscription from "hooks/useSubscription";
import { EVT_START_INDEX, EVT_END_INDEX } from "constants/events";
import css from "./style.module.scss";

const Events = [ EVT_START_INDEX, EVT_END_INDEX ];

const spacerKey = Date.now().toString(36);

const Rows = ({ model, children, Spacer = "div", ...rest }) => useSubscription(
    model, 
    ({ startIndex, endIndex, virtualTopOffset, setSpacerNode }) => {
        
        const result = [
            <Spacer
                key={spacerKey}
                className={css.spacer}
                aria-hidden="true"
                style={{ height: virtualTopOffset}}
                ref={setSpacerNode}
            />
        ];    
        
        for( let i = startIndex; i < endIndex; i++ ){
            result.push(children( i, rest ));
        }

        return result;
    },
    Events
);

export default Rows;