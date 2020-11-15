class SegmentsTree {

    constructor( minCacheOffset ){
        this.minCacheOffset = minCacheOffset || 15;
        this.cacheSize = 0;
        this.N = 0;
        this.cache = new Uint32Array( 1 );
        this.l = +Infinity;
        this.r = -Infinity;
    }

    reallocateIfNeeded( cacheSize, defaultValue ){
        const currentCacheSize = this.cacheSize;
        if( cacheSize !== currentCacheSize ){
            this.cacheSize = cacheSize;
            const newN = 2 << Math.log2( cacheSize, this.minCacheOffset );
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

    get total(){
        return this.cache[ 1 ];
    }

    set( index, value ){
        const { cache, N } = this;
        if( cache[ N + index ] !== value ){
            cache[ N + index ] = value;
            this.l = Math.min( this.l, index );
            this.r = Math.max( this.r, index );
        }
    }

    flush(){
        const { l, r } = this;
        if( Number.isFinite( l ) ){
            if( process.env.NODE_ENV !== "production" ){
                console.log( "Updating heights in range: %d - %d", l, r );
            }
            this.calculateParentsInRange( l, r );
            this.l = +Infinity;
            this.r = -Infinity;
            return true;
        }
        return false;
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