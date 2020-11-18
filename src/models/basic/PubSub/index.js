class PubSub {

    _E = Object.create( null );
    _cQueue = new Set();
    _b = false;

    on( callBack, ...events ){
        for( let evt of events ){
            ( this._E[ evt ] || ( this._E[ evt ] = [] ) ).push( callBack );
        }
        return this;
    }

    destructor(){
        this._E = Object.create( null );
        this._cQueue.clear();
    }

    off( callBack, ...events ){
        for( let evt of events ){
            const eventsList = this._E[ evt ];
            if( eventsList ){
                eventsList.splice( eventsList.indexOf( callBack ) >>> 0, 1 );
            }
        }
        return this;
    }

    startBatch(){
        this._b = true;
        return this;
    }

    endBatch(){
        for( let cb of this._cQueue ){
            cb.call( this );
        }
        this._cQueue.clear();
        this._b = false;
        return this;
    }

    emit( evt ){
        const eventsList = this._E[ evt ];
        if( eventsList ){
            if( this._b ){
                for( let cb of eventsList ){
                    this._cQueue.add( cb );
                }
            }
            else{
                for( let cb of eventsList ){
                    cb.call( this );
                }
            }
        }
        return this;
    }

    
    /* TODO: maybe move these two out of here? */

    set( key, value ){
        if( this[ key ] !== value ){
            this[ key ] = value;
            this.emit( key );
        }
        return this;
    }

    merge( obj ){
        if( obj ){
            this.startBatch();
            for( let k in obj ){
                this.set( k, obj[ k ] );
            }
            this.endBatch();
        }
        return this;
    }
}

export default PubSub;