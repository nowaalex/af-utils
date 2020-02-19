function classNames( arg ){
    for( let j = 1, len = arguments.length, className; j < len; j++ ){
        className = arguments[ j ];
        if( className ){
            arg += ` ${className}`;
        }
    }
    return arg;
}

export default classNames;