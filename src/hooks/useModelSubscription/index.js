import { useEffect, useReducer } from "react";
import useApi from "../useApi";

const increment = x => x + 1;

const useModelSubsctiption = eventsList => {
    const [ , forceUpdate ] = useReducer( increment, 0 );
    const API = useApi();
    
    useEffect(() => {
        API.addListeners( forceUpdate, ...eventsList );
        return () => API.removeListeners( forceUpdate, ...eventsList );
    }, eventsList );

    return API;
}

export default useModelSubsctiption;