/*
    TODO:
        try to find O(N) initialization algorithm instead of O(NlogN)
*/

class FenwickTree {

    constructor(){
        this.N = 0;
        this.C = [];
    }

    sum( r ){
        let result = 0;
        for ( ; r > 0; r -= r & -r ){
            result += this.C[ r ];
        }
        return result;
    }    

    /*
        TODO:
            there is a way to optimize this by doing l >> 1 instead of l-- and 1 << l
    */
    find( v ){
        let k = 0;

        for ( let l = 31 - Math.clz32( this.N ), nk; l >= 0; l-- ){
            nk = k + ( 1 << l );
            if( nk > this.N ){
                continue;
            }
            if( v === this.C[ nk ] ){
                return nk;
            }
            if( v > this.C[ nk ] ) {
                k = nk;
                v -= this.C[ k ];
            }
        }

        return k;
    }

    setN( N, defaultValue ){

        if( N !== this.N ){
            
            this.N = N;
            const oldCache = this.C;
            const oldCacheLen = oldCache.length;
        
            if( N + 1 > oldCacheLen ){
                this.C = new Uint32Array( N + 1 );
                this.C.set( oldCache );

                if( defaultValue ){
                    for( let j = oldCacheLen; j < N; j++ ){
                        this.update( j, defaultValue );
                    }
                }
            }
        }
    }

    update( i, delta ){
        for ( i++; i <= this.N; i += i & -i ){
            this.C[ i ] += delta;
        }
    }
}

export default FenwickTree;