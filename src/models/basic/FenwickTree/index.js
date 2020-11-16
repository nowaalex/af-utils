/*
    TODO:
        try to find O(N) initialization algorithm instead of O(NlogN)
*/

class FenwickTree {

    constructor( defaultInitialValue = 0 ){
        this.N = 0;
        this.total = 0;
        this.dVal = defaultInitialValue;
        this.C = [];
    }

    sum( r ){
        let result = 0;
        for ( ; r > 0; r -= r & -r ){
            result += this.C[ r ];
        }
        return result;
    }    

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

    grow( N ){
        const prevN = this.N;

        if( N > prevN ){
            this.N = N;
            const oldCache = this.C;
            
            // we use beautiful r & -r algo, so array is 1-indexed
            this.C = new Uint32Array( N + 1 );
            this.C.set( oldCache );
            
            if( this.dVal ){
                for( let j = prevN; j < N; j++ ){
                    this.update( j, this.dVal );
                }
            }
        }
    }

    update( i, delta ){
        for ( i++; i <= this.N; i += i & -i ){
            this.C[ i ] += delta;
        }
        this.total += delta;
    }
}

export default FenwickTree;