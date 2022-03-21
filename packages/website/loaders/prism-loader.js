const Prism = require( "prismjs" );
require( "prismjs/components/prism-jsx" );
require( "prismjs/components/prism-bash" );

const jsToMdx = source => {
    const parsed = Prism.highlight(source, Prism.languages.jsx, "jsx");
    return `export default ${JSON.stringify(parsed)}`;
}

module.exports = jsToMdx;