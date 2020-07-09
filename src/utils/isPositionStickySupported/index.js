const elStyle = document.createElement( "a" ).style;
elStyle.cssText = [ "", "-webkit-", "-ms-" ].map( p => `position:${p}sticky` ).join( ";" );

const isSupported = elStyle.position.includes( "sticky" );

const isPositionStickySupported = () => isSupported;

export default isPositionStickySupported;