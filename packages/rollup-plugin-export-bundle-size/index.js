const fs = require( "fs" );
const { minify } = require( "terser" );
const zlib = require( "zlib" );
const util = require( "util" );

const TERSER_OPTS = {
    compress: {
        global_defs: {
            "process.env.NODE_ENV": "production"
        }
    }
};

const gzip = util.promisify( zlib.gzip );
const brotli = util.promisify( zlib.brotliCompress );
const writeFile = util.promisify( fs.writeFile );

const FAKE_OBJ = {
    raw: 0,
    min: 0,
    minGz: 0,
    minBrotli: 0
};

async function write( fileName, fileSizes ){
    const str = Object.entries( fileSizes )
        .map( ([ name, size ]) => `export const ${name} = ${size};` )
        .join( "\n" );
    
    await writeFile( fileName, str );
}

const getFileSizes = async code => {
    const { code: minifiedCode } = await minify( code, TERSER_OPTS );
    const minifiedGzip = await gzip( minifiedCode );
    const minifiedBrotli = await brotli( minifiedCode );

    return {
        raw: code.length,
        min: minifiedCode.length,
        minGz: minifiedGzip.length,
        minBrotli: minifiedBrotli.length
    };
}

const createPlugin = ({ dir, fake = false }) => ({
    writeBundle: async ( _, output ) => {
        for( const file in output ){
            const newFileName = `${dir}/bundlesize.${file}`;
            const { code } = output[ file ];
            if( code ){
                const fileSizes = fake ? FAKE_OBJ : await getFileSizes( code );
                await write( newFileName, fileSizes );
            }
        }
    }
});

module.exports = createPlugin;