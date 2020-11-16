import PropTypes from "prop-types";

const commonPropTypes = {

    rowsQuantity: PropTypes.number.isRequired,

    /**
     * @param {number} rowIndex
     * @returns {any} row element children
     */
    getRowData: PropTypes.func.isRequired,

    /**
     * If sorting/filtering/grouping may happen, it is recommended to include this callback.
     * Otherwise default key, based on rowIndex, is used.
     * 
     * @param {number} rowIndex
     * @returns {number|string} unique row key
     */
    getRowKey: PropTypes.func,

    /**
     * @param {object} rowData, returned by getRowData
     * @param {number} rowIndex
     * @returns {object} Object of props, assigned to row element wrapper
     */
    getRowExtraProps: PropTypes.func,

    /**
     * appended to outermost wrapper
    */
    className: PropTypes.string,

    /**
     * Should be used, if you need to surround it by HOC, such as mobx observer
     */
    RowComponent: PropTypes.elementType,

    /**
     * If true - simpler and faster calculations are used, but you MUST guarantee,
     * that all rows have same height (you may use your styling approach for this).
     */
    fixed: PropTypes.bool,

    /**
     * Maximum number of rows, rendered above and below viewport.
     * Normally should not be overriden.
     */
    overscanRowsCount: PropTypes.number,

    /**
     * This number will not be used as an only source of truth.
     * It is just a hint to minimize number of waste renders
     * and to make scrolling smoother, when row heights differ significantly.
     */
    estimatedRowHeight: PropTypes.number
}

export default commonPropTypes;