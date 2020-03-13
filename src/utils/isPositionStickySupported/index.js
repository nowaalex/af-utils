import once from "lodash/once";

const stickyCssText = [ "", "-webkit-", "-ms-" ].map( p => `position:${p}sticky` ).join( ";" );

const isPositionStickySupported = () => {
    const elStyle = document.createElement( "a" ).style;
    elStyle.cssText = stickyCssText;
    
    return elStyle.position.includes( "sticky" );
};

/*
    'once' is needed to use this function frequently without perf issues.
*/
export default once( isPositionStickySupported );