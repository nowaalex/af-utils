import { EVENTS_ARRAY_LENGTH } from "constants/events";

class PubSub {

    /* All callbacks are known in advance, so we can allocate in construcror */
    _E = Array.from({ length: EVENTS_ARRAY_LENGTH }, () => []);

    /* query of callbacks, that should run after batch end */
    _Q = new Set();

    /* depth of batch */
    inBatch = 0;

    on( callBack, ...events ){
        if( process.env.NODE_ENV !== "production" ){
            if( !callBack ){
                console.error( "Empty callback" ); 
            }
        }
        for( let evt of events ){
            this._E[ evt ].push( callBack );
        }
        return this;
    }

    destructor(){
        for( let events of this._E ){
            events.splice( 0 );
        }
        this._Q.clear();
    }

    off( callBack, ...events ){
        for( let evt of events ){
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

    e( evt ){
        if( this.inBatch ){
            for( let cb of this._E[ evt ] ){
                this._Q.add( cb );
            }
        }
        else{
            for( let cb of this._E[ evt ] ){
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
            for( let cb of this._Q ){
                cb.call( this );
            }
            this._Q.clear();
        }
        return this;
    }
}

export default PubSub;