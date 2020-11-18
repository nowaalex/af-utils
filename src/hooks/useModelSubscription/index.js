import { useEffect } from "react";
import useForceUpdate from "../useForceUpdate";
import useApi from "../useApi";

const useModelSubsctiption = eventsList => {
    const forceUpdate = useForceUpdate();
    const API = useApi();
    
    useEffect(() => {
        API.on( forceUpdate, ...eventsList );
        return () => API.off( forceUpdate, ...eventsList );
    }, eventsList );

    return API;
}

export default useModelSubsctiption;