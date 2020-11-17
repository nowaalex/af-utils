import PropTypes from "prop-types";

const commonPropTypes = {

    rowsQuantity: PropTypes.number.isRequired,


    /**
     * appended to outermost wrapper
    */
    className: PropTypes.string,

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