import RowsSimple from "./RowsSimple";

const createList = BaseClass => class extends BaseClass {
    Rows = new RowsSimple( this );
};

export default createList;