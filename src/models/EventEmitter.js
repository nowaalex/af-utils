class EventEmitter {

    _T = Object.create( null );

    _a( eventName, fn, prepend, once ){

        if( process.env.NODE_ENV !== "production" ){
            if( !eventName || !fn ){
                console.log( eventName, fn );
                throw new Error( "Wrong eventName/fn provided" );
            }
        }

        let eventsQueue = this._T[ eventName ];
        
        if( once ){
            const that = this,
                originalFn = fn;

            /*
                when using ...args and arrow func, babel is making unnecessary arguments copy.
                Going old-school here for perf
            */
            fn = function(){
                originalFn.apply( that.off( eventName, fn ), arguments );
            }
        }
    
        if( !eventsQueue ){
            eventsQueue = this._T[ eventName ] = [];
        }
    
        eventsQueue[ prepend ? "unshift" : "push" ]( fn );
        return this;
    }

    on( eventName, fn ){
        return this._a( eventName, fn, false, false );
    }

    prependListener( eventName, fn ){
        return this._a( eventName, fn, true, false );
    }

    prependOnceListener( eventName, fn ){
        return this._a( eventName, fn, true, true );
    }

    once( eventName, fn ){
        return this._a( eventName, fn, false, true );
    }

    off( eventName, fn ){
        const eventsQueue = this._T[ eventName ];
        if( eventsQueue ){
            const idx = eventsQueue.indexOf( fn );
            if( idx !== -1 ){
                eventsQueue.splice( idx, 1 );
            }
        }
        return this;
    }

    emit( eventName, a1, a2, a3, a4 ){
        const eventsQueue = this._T[ eventName ];
        if( eventsQueue ){
            for( let j = 0, i, evt, argLen = arguments.length, argsArr; j < eventsQueue.length; j++ ){
                evt = eventsQueue[ j ];
                switch( argLen ){
                    case 1: evt.call( this ); break;
                    case 2: evt.call( this, a1 ); break;
                    case 3: evt.call( this, a1, a2 ); break;
                    case 4: evt.call( this, a1, a2, a3 ); break;
                    case 5: evt.call( this, a1, a2, a3, a4 ); break;
                    default:
                        if( !argsArr ){
                            for( i = 1, argsArr = new Array( argLen - 1 ); i < argLen; i++ ){
                                argsArr[ i - 1 ] = arguments[ i ];
                            }
                        }
                        evt.apply( this, argsArr );
                        break;
                }
            }
            return true;
        }
        return false;
    }

    removeAllListeners( eventName ){
        if( eventName ){
            this._T[ eventName ] = [];
        }
        else{
            this._T = Object.create( null );
        }
        return this;
    }
}

EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

export default EventEmitter;