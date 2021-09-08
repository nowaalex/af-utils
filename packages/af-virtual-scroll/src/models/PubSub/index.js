import { EVENTS_ARRAY_LENGTH } from "constants/events";

class PubSub {

    /* All callbacks are known in advance, so we can allocate in construcror */
    _E = Array.from({ length: EVENTS_ARRAY_LENGTH }, () => []);

    /* query of callbacks, that should run after batch end */
    _Q = new Set();

    /* depth of batch */
    _inBatch = 0;

    _on( callBack, events, shouldPrepend ){
        for( const evt of events ){
            this._E[ evt ].splice( shouldPrepend ? 0 : 0x7fffffff, 0, callBack );
        }
        return this;
    }

    on( callBack, ...events ){
        return this._on( callBack, events, false );
    }

    prependListener( callBack, ...events ){
        return this._on( callBack, events, true );
    }

    destructor(){
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

    queue( cb ){
        if( process.env.NODE_ENV !== "production" ){
            if( !this._inBatch ){
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

    startBatch(){
        this._inBatch++;
    }

    endBatch(){
        if( --this._inBatch === 0 ){
            for( const cb of this._Q ){
                cb.call( this );
            }
            this._Q.clear();
        }
    }
}

export default PubSub;