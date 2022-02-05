const Prism = require( "prismjs" );
require( "prismjs/components/prism-jsx" );

const jsToMdx = source => {
    const parsed = Prism.highlight(source, Prism.languages.jsx, 'jsx');
    return `export default ${JSON.stringify(parsed)}`;
}

module.exports = jsToMdx;