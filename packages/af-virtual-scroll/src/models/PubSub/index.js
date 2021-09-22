import { EVENTS_ARRAY_LENGTH } from "constants/events";

class PubSub {

    /* All callbacks are known in advance, so we can allocate in construcror */
    _E = Array.from({ length: EVENTS_ARRAY_LENGTH }, () => []);

    /* query of callbacks, that should run after batch end */
    _Q = new Set();

    /* depth of batch */
    _inBatch = 0;

    on( callBack, ...events ){
        for( const evt of events ){
            this._E[ evt ].push( callBack );
        }
        return this;
    }

    _destroy(){
        for( const events of this._E ){
            events.splice( 0 );
        }
        this._Q.clear();
    }

    off( callBack, ...events ){
        for( const evt of events ){
            this._E[ evt ].splice( this._E[ evt ].indexOf( callBack ) >>> 0, 1 );
        }
        return this;
    }

    _queue( cb ){
        if( process.env.NODE_ENV !== "production" ){
            if( this._inBatch === 0 ){
                console.error( "trying to add event to batch queue, while _inBatch is 0" );
            }
        }
        this._Q.add( cb );
    }

    _emit( evt ){
        if( this._inBatch === 0 ){
            for( const cb of this._E[ evt ] ){
                cb.call( this );
            }
        }
        else{
            for( const cb of this._E[ evt ] ){
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
                cb.call( this );
            }
            this._Q.clear();
        }
    }
}

export default PubSub;