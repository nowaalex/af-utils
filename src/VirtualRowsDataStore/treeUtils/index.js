export const getIndexAtDist = ( rootNodeIndex, dist, tree ) => {
    const N = tree[ 0 ];

    while( rootNodeIndex < N ){
        if( dist >= tree[ rootNodeIndex <<= 1 ] ){
            dist -= tree[ rootNodeIndex ];
            rootNodeIndex |= 1;
        }
    }

    return [ Math.round( rootNodeIndex - N ), dist ];
};

export const sum = ( l, r, tree ) => {  
    let res = 0; 
    const N = tree[ 0 ];
    for( l += N, r += N; l < r; l >>= 1, r >>= 1 ){
        if( l & 1 ){
            res += tree[ l++ ];
        }

        if( r & 1 ){
            res += tree[ --r ]; 
        }
    };

    return res; 
};

export const getEndIndexFromStartIndex = ( startIndex, dist, tree ) => {
    const N = tree[ 0 ];

    for( startIndex += N; startIndex > 1 && dist > tree[ startIndex ]; startIndex >>= 1 ){
        if( startIndex & 1 ){
            dist -= tree[ startIndex++ ];
        }
    }
    
	return getIndexAtDist( startIndex, dist, tree );
};

export const updateNodeAt = ( pos, value, tree ) => {
    const N = tree[ 0 ];
    pos += N;
    if( tree[ pos ] !== value ){
        tree[ pos ] = value; 

        // move upward and update parents 
        for( let i = pos; i > 1; i >>= 1 ){
            tree[ i >> 1 ] = tree[ i ] + tree[ i ^ 1 ];
        }
    }
};

export const getSize = elementsQuantity => Math.pow( 2, Math.ceil( Math.log( elementsQuantity ) / Math.LN2 ) );

const calculateParents = tree => {
    for( let i = tree[ 0 ] - 1; i > 0; --i ){
        tree[ i ] = tree[ i << 1 ] + tree[ i << 1 | 1 ];
    }
};

export const getTree = ( endIndex, startIndex, defaultValue, arr ) => {
    const N = getSize( endIndex );
    const tree = new Uint32Array( N * 2 );
    tree[ 0 ] = N;

    let lastInsertedElementIndex = 0;

    while( lastInsertedElementIndex < N ){
        tree[ N + lastInsertedElementIndex++ ] = defaultValue;
    }

    calculateParents( tree );

    return tree;
};

export const reallocateIfNeeded = ( tree, endIndex, defaultValue ) => {
    const curN = tree[ 0 ];
    const newN = getSize( endIndex );

    if( curN >= newN ){
        return tree;
    }

    const newTree = new Uint32Array( newN * 2 );
    newTree[ 0 ] = newN;
    let idx = 0;

    for( ; idx < curN; idx++ ){
        newTree[ newN + idx ] = tree[ curN + idx ];
    }

    for( ; idx < newN; idx++ ){
        newTree[ newN + idx ] = defaultValue;
    }

    calculateParents( newTree );
    return newTree;
};