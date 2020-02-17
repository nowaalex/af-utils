import { useContext, useLayoutEffect, useReducer } from "react";
import Context from "../Context";

const emptyArr = [];

const reducer = () => performance.now();

/*
	TODO:
		why useEffect does not properly update colgroup of tbody, when rowcount changes from 0 to positive value?
*/

const useApiPluginRaw = (API, subscribeEvents) => {

    const [stamp, up] = useReducer( reducer, 0 );
    
	useLayoutEffect(() => {
		for (let e of subscribeEvents) {
			API.Events.on(e, up);
		}
		return () => {
			for (let e of subscribeEvents) {
				API.Events.off(e, up);
			}
		};
	}, emptyArr );
};

export const useApiContext = () => useContext( Context );

export const useApiPlugin = subscribeEvents => {
	const API = useApiContext();
    useApiPluginRaw( API, subscribeEvents );
    return API;
};
