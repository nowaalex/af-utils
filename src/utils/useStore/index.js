import { useRef, useEffect } from "react";

/*
    dataRef is to call Data methods from outside( Data.scrollTo(), etc. ).
    As it is not dom-related, I decided to avoid forwardRef
*/
const useStore = ( StoreConstructor, dataRef, propsToMerge ) => {

    const scrollContainerRef = useRef();
    const rowsContainerRef = useRef();

    const finalDataRef = useRef();

    let Store = finalDataRef.current;

    if( !Store || !( Store instanceof StoreConstructor ) ){
        Store = finalDataRef.current = new StoreConstructor();
    }

    if( dataRef ){
        dataRef.current = Store;
    }

    useEffect(() => {
        Store.merge({
            ...propsToMerge,
            rowsContainerNode: rowsContainerRef.current,
            scrollContainerNode: scrollContainerRef.current
        });
    });

    useEffect(() => () => {
        Store.destructor();
    }, [ Store ]);

    return [ Store, scrollContainerRef, rowsContainerRef ];
};

export default useStore;