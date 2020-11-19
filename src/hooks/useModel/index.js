import { useRef, useEffect } from "react";

/*
    dataRef is to call Data methods from outside( Data.scrollTo(), etc. ).
    As it is not dom-related, I decided to avoid forwardRef
*/
const useStore = ( StoreConstructor, dataRef, estimatedRowHeight, overscanRowsCount, rowsQuantity, rowsContainerNode ) => {

    const finalDataRef = useRef();

    let Store = finalDataRef.current;

    if( !( Store instanceof StoreConstructor ) ){
        Store = finalDataRef.current = new StoreConstructor();
    }

    if( dataRef ){
        dataRef.current = Store;
    }

    Store.startBatch().setViewParams( estimatedRowHeight, overscanRowsCount, rowsQuantity, rowsContainerNode );

    useEffect(() => {
        Store.endBatch();
    });
    
    useEffect(() => () => Store.destructor(), [ Store ]);

    return Store;
};

export default useStore;