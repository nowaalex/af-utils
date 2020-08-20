const N = 8192;

class FenwickTree {

    constructor( minCacheOffset ){
        this.minCacheOffset = minCacheOffset || 15;
        this.cache = new Uint32Array( N );
        this.vCache = new Uint32Array( N );
    }

    sum( r ){
        let result = 0;
        for ( r--; r >= 0; r = ( r & ( r + 1 ) ) - 1 ){
            result += this.cache[ r ];
        }
        return result;
    }

    sum2( l, r ){
        return this.sum( r ) - this.sum( l );
    }
    
    find( v ){
        let sum = 0, pos = 0;
	
        for( let i = N; i > 0; i >>= 1 ){
            if( sum + this.cache[ pos + i - 1 ] <= v ){
                sum += this.cache[ pos + i - 1 ];
                pos += i;
            }
        }

        return pos;
    }

    set( i, value ){
        const delta = value - this.vCache[ i ];
        if( delta ){
            this.vCache[ i ] = value;
            for (; i < N; i = ( i | ( i + 1 ) ) ){
                this.cache[ i ] += delta;
            }
        }
    }
}

export default FenwickTree;