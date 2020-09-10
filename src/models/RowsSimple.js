class RowsSimple {

    constructor( parent ){
        this.parent = parent;
    }

    get visibleRowCount(){
        return this.parent.rows.length;
    }
}

export default RowsSimple;