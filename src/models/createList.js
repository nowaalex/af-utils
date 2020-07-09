import RowsSimple from "./RowsSimple";

const createList = BaseClass => class extends BaseClass {
    constructor(){
        super( RowsSimple );
    }
};

export default createList;