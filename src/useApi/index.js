import { useContext, useLayoutEffect, useReducer } from "react";
import Context from "../Context";

const emptyArr = [];

const reducer = x => x + 1;

/*
	TODO:
		why useEffect does not properly update colgroup of tbody, when rowcount changes from 0 to positive value?
*/

export const useApiContext = () => useContext( Context );

export const useApiPlugin = subscribeEvents => {
	const API = useApiContext();

	const [, up] = useReducer( reducer, 0 );
    
	useLayoutEffect(() => {
		for (let e of subscribeEvents) {
			API.on(e, up);
		}
		return () => {
			for (let e of subscribeEvents) {
				API.off(e, up);
			}
		};
	}, emptyArr );

	return API;
};
