import { Component } from "react";


class Subscription extends Component {
    
    _prevRenderResult = null;
    _wasRenderedViaForceUpdate = true;

    _up = () => {
        this.forceUpdate();
        this._wasRenderedViaForceUpdate = true;
    }

    componentDidMount(){
        this.props.model._sub( this._up );
    }

    render(){
        if( this._wasRenderedViaForceUpdate ){
            this._wasRenderedViaForceUpdate = false;
            this._prevRenderResult = this.props.children( this.props.model );
        }
        else {
            this.props.model._queue( this._up );
        }

        return this._prevRenderResult;
    }

    componentWillUnmount(){
        this.props.model._unsub( this._up );
    }
}


export default Subscription;