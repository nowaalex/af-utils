const SUBARRAY_LENGTH = 30;

/*
    {
        startIndex: 0,
        arr: [ 1, 3, 5, 7, 9, 11, 13 ],
        left: {
            startIndex: 0,
            
        }
    }
*/

class MeasurementsCache {
    averageRowHeight = 0;
    cacheSize = 0;
    rowHeights = [];

    setRowHeight( rowIndex, rowHeight ){
        const curHeight = this.rowHeights[ rowIndex ];
        if( curHeight !== rowHeight ){
            this.rowHeights[ rowIndex ] = rowHeight;
            if( !curHeight ){
                this.cacheSize++;
            }
            this.averageRowHeight += ( rowHeight - this.averageRowHeight ) / this.cacheSize;
        }
    }

    getRowsBetween( startIndex, pxHeight ){
        /* TODO: unoptimal!! */
        let res = 0;
        for( let j = from; j < to; j++ ){
            res += this.rowHeights[ j ] || this.averageRowHeight;
        }
        return res;
    }

    getAverageRowHeight(){
        return this.averageRowHeight;
    }

    clear(){
        this.rowHeights = [];
        this.averageRowHeight = 0;
    }
}

export default MeasurementsCache;