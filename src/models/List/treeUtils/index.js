export const walkUntil = ( dist, tree ) => {
    const N = tree[ 0 ];

    let nodeIndex = 1, v;

    while( nodeIndex < N ){
        v = tree[ nodeIndex <<= 1 ];
        if( dist >= v ){
            dist -= v;
            nodeIndex |= 1;
        }
    }

    /*
        IDEA:
            pack this to one double number.
            num + remianer / 65535
            Cons:
                * unobvious
                * perf fault because of double type costs.
    */
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

// export const changeExcep

/*
    We always do batch insert, so there is no sense to update all parents each time.
    It is more logical to insert leaves and then call calculateParentsInRange once.

    IDEA:
        * maybe reimplement this method using Duff's device( l++,r-- in one iteration) and make benchmarks for different l-r ranges
*/
export const calculateParentsInRange = ( l, r, tree ) => {
    const N = tree[ 0 ];
    
    for( r += N, l += N; r >>= 1; ){
        for( let i = l >>= 1; i <= r; i++ ){
            tree[ i ] = tree[ i << 1 ] + tree[ i << 1 | 1 ];
        }
    }
};


/*
    This constant is used for 2 reasons:
        * Math.log2( 1 ) is 0, which is not correct for cache size calculation
        * We should always have some extra space for new rows. We do not want to reallocate cache every time.
*/
const MIN_TREE_CACHE_SIZE = 32;

export const reallocateIfNeeded = ( tree, endIndex, defaultValue ) => {

    let N = tree ? tree[ 0 ] : 0;

    if( endIndex > N ){
        N = 2 ** Math.ceil( Math.log2( endIndex + MIN_TREE_CACHE_SIZE ) );
        /*
            Uint16 cannot be used here, because array stores intermediate sums, which can be huge.
        */
        tree = new Uint32Array( N * 2 );
        tree[ 0 ] = N;
    }

    /* clearing only what is needed */
    tree
        .fill( 0, 2, N + endIndex >> 1 )
        .fill( defaultValue, N, N + endIndex );

    /*
        Trees are not always ideally allocated, gaps are possible.
        Classical way for calculating parents is much simpler,
        but can do much more work(summing zeros) in such conditions. Commented classic algo:

        for( let i = N + endIndex >> 1, j; i > 0; --i ){
            j = i << 1;
            tree[ i ] = tree[ j ] + tree[ j | 1 ];
        }
    */
    calculateParentsInRange( 0, endIndex, tree );

    return tree;
};