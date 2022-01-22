import startCase from "lodash/startCase";

const humanizeRoute = route => route
    .split( "/" )
    .filter(( el, i ) => i > 1 )
    .map( startCase )
    .join( " / " );

export default humanizeRoute;