import { extendObservable, reaction, computed } from "mobx";
import add from "lodash/add";
import RowsComplex from "./RowsComplex";

/*
    can't extend from both FixedSizeList and VariableSizeList, so exporting compositor
*/
const createTable = BaseClass => class extends BaseClass {

    @computed get tbodyColumnWidthsSum(){
        return this.tbodyColumnWidths.reduce( add );
    }

    constructor(){
        super( RowsComplex );

        extendObservable( this, {
            columns: [],
            totals: {},
            headlessMode: false,
            getCellData: null,
            tbodyColumnWidths: []
        });

        this.dispose = reaction(() => this.Rows.sorted, () => this.scrollToStart() );
    }

    destructor(){
        this.Rows.destructor();
        this.dispose();
        super.destructor();
    }
}

export default createTable;