/*

[
    [ 1, 3, 5, 6, 2, 5, 10, 6, 8],
    [  4,    11,    7,    16,   ],
    [     15,          23,      ],
    [            38             ]
]
*/

const DEPTH = 8;

class SumsStorage {

    Storage = Array.from(Array( DEPTH), () => [])

    insert( pos, num ){
        for( let j = 0, neighbour, row; j < DEPTH; j++ ){
            row = this.Storage[ j ];
            if( row[ pos ] === num ){
                break;
            }
            row[ pos ] = num;
            neighbour = row[ pos ^ 1 ];
            if( neighbour === undefined ){
                break;
            }
            num += neighbour;
            pos = pos / 2 | 0;
        }
    }

    sum( i, limit ){

        if( !limit ){
            return [ i, 0 ];
        }

        let accumulated = 0,
            isDescending = false,
            A = this.Storage,
            level = i === 0 ? A.length - 1 : 0,
            curLevel,
            curVal;

        let p = 0;

        for( ;; ){
            p++;

            curLevel = A[ level ];
            curVal = curLevel[ i ];

            if( curVal === undefined || accumulated + curVal > limit ){
                if( level ){
                    i *= 2;
                    level--;
                    isDescending = true;
                    continue;
                }
                console.log( "P", p, this.Storage )
                return [ i, accumulated ];
            }

            if( isDescending || i % 2 || level === A.length - 1 ){
                i++;
                accumulated += curVal;
                continue;
            }

            i /= 2;
            level++;
        }
    }

    get( index ){
        return this.Storage[ 0 ][ index ];
    }
}

export default SumsStorage;