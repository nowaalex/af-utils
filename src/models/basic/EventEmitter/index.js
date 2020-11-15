class EventEmitter {

    _EventsMap = Object.create( null );
    _PendingCallbacksQueue = new Set();
    _batchEnabled = false;

    addListeners( callBack, ...events ){
        for( let evt of events ){
            let eventsList = this._EventsMap[ evt ];
            if( !eventsList ){
                eventsList = this._EventsMap[ evt ] = [];
            }
            if( !eventsList.includes( callBack ) ){
                eventsList.push( callBack );
            }
        }
        return this;
    }

    destructor(){
        this._EventsMap = Object.create( null );
        this._PendingCallbacksQueue.clear();
    }

    removeListeners( callBack, ...events ){
        for( let evt of events ){
            const eventsList = this._EventsMap[ evt ];
            if( eventsList ){
                const idx = eventsList.indexOf( callBack );
                if( idx !== -1 ){
                    eventsList.splice( idx, 1 );
                }
            }
        }
        return this;
    }

    startBatch(){
        this._batchEnabled = true;
        return this;
    }

    endBatch(){
        for( let cb of this._PendingCallbacksQueue ){
            cb.call( this );
        }
        this._PendingCallbacksQueue.clear();
        this._batchEnabled = false;
        return this;
    }

    emit( evt ){
        const eventsList = this._EventsMap[ evt ];
        if( eventsList ){
            if( this._batchEnabled ){
                for( let cb of eventsList ){
                    this._PendingCallbacksQueue.add( cb );
                }
            }
            else{
                for( let cb of eventsList ){
                    cb();
                }
            }
        }
        return this;
    }
}

export default EventEmitter;