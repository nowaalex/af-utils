import startCase from "lodash/startCase";

const EXCEPTIONS = {
    complexTable: "Complex Table (unstable)"
};

const urlToTitle = url =>
    url
        .split("/")
        .slice(3)
        .map(v => EXCEPTIONS[v] || startCase(v))
        .join(" / ");

export default urlToTitle;
