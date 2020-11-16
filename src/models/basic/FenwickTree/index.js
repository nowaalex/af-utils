class FenwickTree {

    constructor(){
        this.N = 0;
        this.total = 0;
        this.dVal = 20;
        this.cache = this.vCache = [];
    }

    sum( r ){
        let result = 0;
        for ( ; r > 0; r -= r & -r ){
            result += this.cache[ r ];
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
            if( v === this.cache[ nk ] ){
                return nk;
            }
            if( v > this.cache[ nk ] ) {
                k = nk;
                v -= this.cache[ k ];
            }
        }

        return k;
    }

    growIfNeeded( N ){
        const prevN = this.N;

        if( N > prevN ){
            this.N = N;
            const oldCache = this.cache;
            const oldVCache = this.vCache;
            this.vCache = new Uint32Array( N );
            this.cache = new Uint32Array( N + 1 );
            this.cache.set( oldCache );
            this.vCache.set( oldVCache );
            this.vCache.fill( this.dVal, prevN );
            for( let j = prevN; j < N; j++ ){
                this.update( j, this.dVal );
            }
        }
    }

    update( i, delta ){
        for ( i++; i <= this.N; i += i & -i ){
            this.cache[ i ] += delta;
        }
        this.total += delta;
    }

    set( i, value ){
        const delta = value - this.vCache[ i ];
        if( delta ){
            this.vCache[ i ] = value;
            this.update( i, delta );
        }
    }
}

export default FenwickTree;