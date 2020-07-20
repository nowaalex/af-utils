import { computed } from "mobx";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import times from "lodash/times";

class RowsSimple {

    constructor( parent ){
        this.parent = parent;
    }

    get visibleRowCount(){
        return this.parent.rows.length;
    }
}

export default RowsSimple;