import { EVENTS_ARRAY_LENGTH } from "constants/events";

class PubSub {

    _E = Array.from({ length: EVENTS_ARRAY_LENGTH }, () => []);
    _cQueue = new Set();
    _b = 0;

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
        for( let j = 0; j < EVENTS_ARRAY_LENGTH; j++ ){
            this._E[ j ] = [];
        }
        this._cQueue.clear();
    }

    off( callBack, ...events ){
        for( let evt of events ){
            this._E[ evt ].splice( this._E[ evt ].indexOf( callBack ) >>> 0, 1 );
        }
        return this;
    }

    startBatch(){
        this._b++;
        return this;
    }

    endBatch(){
        if( !--this._b ){
            for( let cb of this._cQueue ){
                cb.call( this );
            }
            this._cQueue.clear();
        }
        return this;
    }

    e( evt ){
        if( this._b ){
            for( let cb of this._E[ evt ] ){
                this._cQueue.add( cb );
            }
        }
        else{
            for( let cb of this._E[ evt ] ){
                cb.call( this );
            }
        }
        return this;
    }
}

export default PubSub;