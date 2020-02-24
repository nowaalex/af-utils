export const updateNodeAt = ( pos, value, tree ) => {
    const N = tree[ 0 ];
    pos += N;
    if( tree[ pos ] !== value ){
        tree[ pos ] = value;
        for( let i = pos, curSum; i > 1; ){
            curSum = tree[ i ] + tree[ i ^ 1 ];
            tree[ i >>= 1 ] = curSum;
        }
    }
};