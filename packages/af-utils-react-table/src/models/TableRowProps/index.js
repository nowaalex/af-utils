const getRowPropsDefault = (model, i) => ({ ref: el => model.el(i, el) });

class TableRowProps {
    constructor(columns, components, getRowData, getRowProps) {
        this.columns = columns;
        this.components = components;
        this.getRowData = getRowData;
        this.getRowProps = getRowProps || getRowPropsDefault;
    }
}

export default TableRowProps;
