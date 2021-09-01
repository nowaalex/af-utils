import { EVENTS_ARRAY_LENGTH } from "src/constants/events";

class PubSub {

    /* All callbacks are known in advance, so we can allocate in construcror */
    _E = Array.from({ length: EVENTS_ARRAY_LENGTH }, () => []);

    /* query of callbacks, that should run after batch end */
    _Q = new Set();

    /* depth of batch */
    inBatch = 0;

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
            if( !this.inBatch ){
                console.error( "trying to add event to batch queue, while inBatch is 0" );
            }
        }
        this._Q.add( cb );
    }

    emit( evt ){
        if( this.inBatch ){
            for( const cb of this._E[ evt ] ){
                this._Q.add( cb );
            }
        }
        else{
            for( const cb of this._E[ evt ] ){
                cb.call( this );
            }
        }
        return this;
    }

    /* inspired by mobx */

    startBatch(){
        this.inBatch++;
        return this;
    }

    endBatch(){
        if( !--this.inBatch ){
            for( const cb of this._Q ){
                cb.call( this );
            }
            this._Q.clear();
        }
        return this;
    }
}

export default PubSub;