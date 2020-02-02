import { useContext, useEffect, useReducer } from "react";
import Context from "../Context";

const reducer = () => performance.now();

const useApiPluginRaw = (API, subscribeEvents) => {

    const [stamp, up] = useReducer( reducer, 0 );
    
	useEffect(() => {
		for (let e of subscribeEvents) {
			API.Events.on(e, up);
		}
		return () => {
			for (let e of subscribeEvents) {
				API.Events.off(e, up);
			}
		};
	}, []);
};

export const useApiContext = () => useContext( Context );

export const useApiPlugin = subscribeEvents => {
	const API = useApiContext();
    useApiPluginRaw( API, subscribeEvents );
    return API;
};
