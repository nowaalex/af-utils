import commonDefaultProps from "../../../components/common/defaultProps";

const commonProps = [
    {
        name: "rowsQuantity",
        type: "number",
        required: true
    },
    {
        name: "className",
        type: "string",
        description: "className, appended to the outermost wrapper"
    },
    {
        name: "fixed",
        type: "bool",
        defaultValue: commonDefaultProps.fixed.toString(),
        description: `
            true - you guarantee, that all children have same height and is determined by first rendered child.
            false - special cache is created, which allows rows to have different height.
        `
    },
    {
        name: "overscanRowsCount",
        type: "number",
        defaultValue: commonDefaultProps.overscanRowsCount,
        description: `Maximum number of rows, rendered above and below viewport.
        Normally should not be overriden.`
    },
    {
        name: "estimatedRowHeight",
        type: "number",
        defaultValue: commonDefaultProps.estimatedRowHeight,
        description: `
            This number will NOT be used as an only source of truth.
            It is just a hint to minimize number of waste renders
            and to make scrolling smoother, especially when row heights differ significantly.
        `
    }
];

export default commonProps;