import { useReducer } from "react";

const increment = x => x + 1;

const useForceUpdate = () => useReducer( increment, 0 )[ 1 ];

export default useForceUpdate;