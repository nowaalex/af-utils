import { useReducer } from "react";

const increment = x => x + 1;

const useForceUpdate = () => {
    const [ , forceUpdate ] = useReducer( increment, 0 );
    return forceUpdate;
}

export default useForceUpdate;