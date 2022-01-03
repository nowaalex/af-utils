class PubSub {

    _EventsList = [];

    /* query of callbacks, that should run after batch end */
    _Query = new Set();

    /* depth of batch */
    _inBatch = 0;

    _sub( callBack ){
        this._EventsList.push( callBack );
    }

    _destroy(){
        this._EventsList.splice( 0 );
        this._Query.clear();
    }

    _unsub( callBack ){
        this._EventsList.splice( this._EventsList.indexOf( callBack ) >>> 0, 1 );
    }

    _queue( cb ){
        if( process.env.NODE_ENV !== "production" ){
            if( this._inBatch === 0 ){
                console.error( "trying to add event to batch queue, while _inBatch is 0" );
            }
        }
        this._Query.add( cb );
    }

    _run(){
        if( this._inBatch === 0 ){
            for( const cb of this._EventsList ){
                cb();
            }
        }
        else{
            for( const cb of this._EventsList ){
                this._Query.add( cb );
            }
        }
    }

    /* inspired by mobx */

    _startBatch(){
        this._inBatch++;
    }

    _endBatch(){
        if( --this._inBatch === 0 ){
            for( const cb of this._Query ){
                /*
                    These callbacks must not call _startBatch from inside.
                */
                cb();
            }
            this._Query.clear();
        }
    }
}

export default PubSub;