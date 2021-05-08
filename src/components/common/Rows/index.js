import useSubscription from "hooks/useSubscription";
import { START_INDEX, END_INDEX } from "constants/events";
import css from "./style.module.scss";

const Events = [ START_INDEX, END_INDEX ];

const spacerKey = Math.random().toString(36);

const Rows = ({ model, renderRow, Spacer = "div", ...rest }) => useSubscription(
    model, 
    ({ startIndex, endIndex, virtualTopOffset, setSpacerNode }) => {

        const result = [
            <Spacer
                key={spacerKey}
                className={css.wrapper}
                aria-hidden="true"
                style={{ height: virtualTopOffset}}
                ref={setSpacerNode}
            />
        ];    
        
        for( let i = startIndex; i < endIndex; i++ ){
            result.push(renderRow( i, rest ));
        }

        return result;
    },
    Events
);

export default Rows;