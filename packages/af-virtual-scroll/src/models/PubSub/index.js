/*
    Simplified mobx idea.
    Forbidden:
        * calling _sub / _unsub inside batch block
        * calling _startBatch / _endBatch inside _run
*/
class PubSub {

    _EventsList = [];
    _wasRunAttempted = false;
    _inBatch = 0;

    _sub( callBack ){
        this._EventsList.push( callBack );
    }

    _unsub( callBack ){
        this._EventsList.splice( this._EventsList.indexOf( callBack ) >>> 0, 1 );
    }

    _run(){
        if( this._inBatch === 0 ){
            for( const cb of this._EventsList ){
                cb();
            }
        }
        else {
            this._wasRunAttempted = true;
        }
    }

    _startBatch(){
        this._inBatch++;
    }

    _endBatch(){
        if( --this._inBatch === 0 && this._wasRunAttempted === true ){
            for( const cb of this._EventsList ){
                cb();
            }
            this._wasRunAttempted = false;
        }
    }
}

export default PubSub;