import { ColumnModel as BaseColumnModel } from "@af-utils/react-table";

const defaultCompare = new Intl.Collator(undefined, { numeric: true }).compare;

const numericCompare = (a, b) => (a || 0) - (b || 0);

const identity = v => v;

const getSorter = sortVal => {
    if (!sortVal) {
        return null;
    }

    if (sortVal === "numeric") {
        return numericCompare;
    }

    return defaultCompare;
};

class ColumnModel extends BaseColumnModel {
    static KEYS = [
        ...super.KEYS,
        "formatTotal",
        "totals",
        "priorityGroupValues",
        "initialGroupingIndex",
        "getSortValue",
        "getGroupValue",
        "getFilterValue",
        "getGroupLabel"
    ];

    constructor(col, components) {
        super(col, components);

        this.getSortValue ||= identity;
        this.getFilterValue ||= identity;
        this.getGroupValue ||= identity;

        this._sorter = getSorter(col.sort);
        this.sortable = !!this._sorter;
    }
}

export default ColumnModel;
