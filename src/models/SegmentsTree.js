const MIN_TREE_CACHE_OFFSET = 15;

const getN = ( cacheSize, minCacheOffset ) => 2 << Math.log2( cacheSize + minCacheOffset );

class SegmentsTree {

    constructor( minCacheOffset = MIN_TREE_CACHE_OFFSET ){
        this.minCacheOffset = minCacheOffset;
        this.cacheSize = 0;
        this.N = 0;
        this.cache = new Uint32Array( 1 );
    }

    reallocateIfNeeded( cacheSize, defaultValue ){
        const currentCacheSize = this.cacheSize;
        if( cacheSize !== currentCacheSize ){
            this.cacheSize = cacheSize;
            const newN = getN( cacheSize, this.minCacheOffset );
            if( newN !== this.N ){
                this.N = newN;
                this.cache = new Uint32Array( newN << 1 );
            }
            else if( currentCacheSize > cacheSize ){
                this.cache.fill( 0, newN + cacheSize, newN + currentCacheSize );
            }
        }
        this.reset( defaultValue );
    }

    reset( defaultValue ){
        const { cache, N, cacheSize } = this;
        cache.fill( defaultValue, N, N + cacheSize );
        this.calculateParentsInRange( 0, cacheSize );        
    }

    calculateParentsInRange( startIndex, endIndex ){
        const { cache, N } = this;
    
        for( endIndex += N, startIndex += N; endIndex >>= 1; ){
            for( let i = startIndex >>= 1; i <= endIndex; i++ ){
                cache[ i ] = cache[ i << 1 ] + cache[ i << 1 | 1 ];
            }
        }
    }

    get height(){
        return this.cache[ 1 ];
    }

    get( index ){
        return this.cache[ this.N + index ];
    }

    set( index, value ){
        this.cache[ this.N + index ] = value;
    }

    getStartPositionForSum( dist ){
        const { cache, N } = this;

        let nodeIndex = 1, v;

        while( nodeIndex < N ){
            v = cache[ nodeIndex <<= 1 ];
            if( dist >= v ){
                dist -= v;
                nodeIndex |= 1;
            }
        }

        return [ nodeIndex - N, dist ];
    }

    getDistanceBetweenIndexes( startIndex, endIndex ){

        const { cache, N } = this;

        let res = 0;

        for( startIndex += N, endIndex += N; startIndex < endIndex; startIndex >>= 1, endIndex >>= 1 ){
            if( startIndex & 1 ){
                res += cache[ startIndex++ ];
            }

            if( endIndex & 1 ){
                res += cache[ --endIndex ]; 
            }
        };

        return res; 
    }
}

export default SegmentsTree;