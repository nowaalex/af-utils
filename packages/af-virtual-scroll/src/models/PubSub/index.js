class PubSub {

    _E = [];

    /* query of callbacks, that should run after batch end */
    _Q = new Set();

    /* depth of batch */
    _inBatch = 0;

    _sub( callBack ){
        this._E.push( callBack );
    }

    _destroy(){
        this._E.splice( 0 );
        this._Q.clear();
    }

    _unsub( callBack ){
        this._E.splice( this._E.indexOf( callBack ) >>> 0, 1 );
    }

    _queue( cb ){
        if( process.env.NODE_ENV !== "production" ){
            if( this._inBatch === 0 ){
                console.error( "trying to add event to batch queue, while _inBatch is 0" );
            }
        }
        this._Q.add( cb );
    }

    _run(){
        if( this._inBatch === 0 ){
            for( const cb of this._E ){
                cb();
            }
        }
        else{
            for( const cb of this._E ){
                this._Q.add( cb );
            }
        }
    }

    /* inspired by mobx */

    _startBatch(){
        this._inBatch++;
    }

    _endBatch(){
        if( --this._inBatch === 0 ){
            for( const cb of this._Q ){
                /*
                    These callbacks must not call _startBatch from inside.
                */
                cb();
            }
            this._Q.clear();
        }
    }
}

export default PubSub;