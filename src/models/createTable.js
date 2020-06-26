import { extendObservable, computed } from "mobx";
import add from "lodash/add";
import RowsComplex from "./RowsComplex";

/*
    can't extend from both FixedSizeList and VariableSizeList, so exporting compositor
*/
const createTable = BaseClass => class extends BaseClass {

    Rows = new RowsComplex( this );

    @computed get tbodyColumnWidthsSum(){
        return this.tbodyColumnWidths.reduce( add );
    }

    constructor(){
        super();

        extendObservable( this, {
            columns: [],
            totals: {},
            headlessMode: false,
            getCellData: null,
            tbodyColumnWidths: []
        });
    }

    destructor(){
        super.destructor();
    }
}

export default createTable;