import { useState, useEffect } from "react";
import VariableHeightsModel from "models/VariableSizeList";
import FixedHeightsModel from "models/FixedSizeList";
import { EMPTY_ARRAY } from "constants";

const useVirtual = ({
    itemCount = 0,
    estimatedItemSize = 20,
    overscanCount = 3,
    horizontal = false,
    fixed = false
}) => {
    const [ model ] = useState(() => new ( fixed ? FixedHeightsModel : VariableHeightsModel ));

    model._startBatch();
    model._setParams( estimatedItemSize, overscanCount, itemCount, horizontal );

    useEffect(() => {
        model._endBatch();
    });

    useEffect(() => () => model._destroy(), EMPTY_ARRAY);

    if( process.env.NODE_ENV !== "production" ){
        const AssumedConstructor = fixed ? FixedHeightsModel : VariableHeightsModel;
        if( !( model instanceof AssumedConstructor ) ){
            console.warn( `
                'fixed' prop is taken into account ONLY during initial component mount.
                All future changes are ignored. You must decide once.`
            );
        }
    }

    return model;
}
    
export default useVirtual;