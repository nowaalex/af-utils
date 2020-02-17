/*
    This constant is used for 2 reasons:
        * Math.log2( 1 ) is 0, which is not correct for cache size calculation
        * We should always have some extra space for new rows. We do not want to reallocate cache every time.
*/
const MIN_TREE_CACHE_SIZE = 32;

export const getIndexAtDist = ( dist, tree ) => {
    const N = tree[ 0 ];

    let nodeIndex = 1;

    for( let v; nodeIndex < N; ){
        v = tree[ nodeIndex <<= 1 ];
        if( dist >= v ){
            dist -= v;
            nodeIndex |= 1;
        }
    }

    return [ nodeIndex - N, dist ];
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

/*
    TODO:
        this can be optimized even more
*/
export const calculateParentsAt = ( posSet, tree ) => {
    for( let pos of posSet ){
        for( let i = pos, curSum; i > 1; ){
            curSum = tree[ i ] + tree[ i ^ 1 ];
            tree[ i >>= 1 ] = curSum;
        }
    }
};

/*
    We always do batch insert, so there is no sense to update all parents each time.
    It is more logical to call updateNodeAt many times, and then call calculateParentsAtPos once.
*/
export const updateNodeAt = ( pos, value, tree ) => {
    const N = tree[ 0 ];
    pos += N;
    if( tree[ pos ] !== value ){
        tree[ pos ] = value;
        return pos | 1;
    }
    return 0;
};

export const getSize = elementsQuantity => 2 ** Math.ceil( Math.log2( elementsQuantity + MIN_TREE_CACHE_SIZE ) );

const calculateAllParents = ( tree, endIndex ) => {
    for( let i = tree[ 0 ] + endIndex >> 1, j; i > 0; --i ){
        j = i << 1;
        tree[ i ] = tree[ j ] + tree[ j | 1 ];
    }
};

const getTreeContainer = endIndex => {
    const N = getSize( endIndex );
    const tree = new Uint32Array( N * 2 );
    tree[ 0 ] = N;

    return tree;
};

export const getTree = ( endIndex, defaultValue ) => {
    const tree = getTreeContainer( endIndex );
    const N = tree[ 0 ];

    tree.fill( defaultValue, N, endIndex + N );
    calculateAllParents( tree, endIndex );
    return tree;
};

/*
    TODO:
        think about reducing cache size( now it only increases )
*/
export const reallocateIfNeeded = ( tree, prevEndIndex, endIndex, defaultValue ) => {

    let N = tree[ 0 ];

    if( endIndex > prevEndIndex ){
        if( endIndex > N ){
            const newTree = getTreeContainer( endIndex );
            const newN = newTree[ 0 ];
    
            for( let idx = 0; idx < prevEndIndex; idx++ ){
                newTree[ newN + idx ] = tree[ N + idx ];
            }
            
            tree = newTree;
            N = newN;
        }
    }
    else{
        endIndex ^= prevEndIndex;
        prevEndIndex ^= endIndex;
        endIndex ^= prevEndIndex;
        defaultValue = 0;
    }

    tree.fill( defaultValue, N + prevEndIndex, N + endIndex );
    calculateAllParents( tree, endIndex );
    return tree;
};