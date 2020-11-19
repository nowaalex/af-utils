const startCase = str => str.replace( /([a-z])([A-Z])/g, "$1 $2" ).replace( /\b[a-z]/g, x => x.toUpperCase() );

export default startCase;