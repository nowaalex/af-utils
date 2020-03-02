import { useContext, useLayoutEffect, useReducer } from "react";
import Context from "../Context";

const emptyArr = [];

const reducer = x => x + 1;

/*
	TODO:
		why useEffect does not properly update colgroup of tbody, when rowcount changes from 0 to positive value?
*/

const useApi = subscribeEvents => {

	const API = useContext( Context );

	const [, up] = useReducer( reducer, 0 );
    
	useLayoutEffect(() => {
		for( let j = 0; j < subscribeEvents.length; j++ ){
			API.on( subscribeEvents[ j ], up );
		}
		return () => {
			for( let j = 0; j < subscribeEvents.length; j++ ){
				API.off( subscribeEvents[ j ], up );
			}
		};
	}, emptyArr );

	return API;
};

export default useApi;
