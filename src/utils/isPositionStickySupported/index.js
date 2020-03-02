import once from "lodash/once";

const PREFIXES = [ "", "-webkit-", "-ms-" ];

const isPositionStickySupported = once(() => {

    const el = document.createElement( "a" ),
        mStyle = el.style;

    mStyle.cssText = PREFIXES.map( p => `position:${p}sticky` ).join( ";" );
    
    return mStyle.position.includes( "sticky" );
}); 

export default isPositionStickySupported;