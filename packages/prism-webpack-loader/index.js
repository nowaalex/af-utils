const Prism = require("prismjs");

require("prismjs/components/prism-jsx");
require("prismjs/components/prism-js-extras");
require("prismjs/components/prism-bash");
require("prismjs/components/prism-css");
require("prismjs/components/prism-css-extras");

const jsToMdx = source => {
    const parsed = Prism.highlight(source, Prism.languages.jsx, "jsx");
    return `export default ${JSON.stringify(parsed)}`;
};

module.exports = jsToMdx;
