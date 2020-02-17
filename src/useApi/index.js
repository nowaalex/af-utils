import { useContext, useLayoutEffect, useReducer } from "react";
import Context from "../Context";

const emptyArr = [];

const reducer = x => x + 1;

/*
	TODO:
		why useEffect does not properly update colgroup of tbody, when rowcount changes from 0 to positive value?
*/

const useApiPluginRaw = ( ApiEvents, subscribeEvents) => {

    const [, up] = useReducer( reducer, 0 );
    
	useLayoutEffect(() => {
		for (let e of subscribeEvents) {
			ApiEvents.on(e, up);
		}
		return () => {
			for (let e of subscribeEvents) {
				ApiEvents.off(e, up);
			}
		};
	}, emptyArr );
};

export const useApiContext = () => useContext( Context );

export const useApiPlugin = subscribeEvents => {
	const API = useApiContext();
    useApiPluginRaw( API.Events, subscribeEvents );
    return API;
};
