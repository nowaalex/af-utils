import startCase from "lodash/startCase";

const humanizeRoute = route => route.split( "/" ).map( startCase ).join( " / " );

export default humanizeRoute;