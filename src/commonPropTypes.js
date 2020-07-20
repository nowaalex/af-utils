import PropTypes from "prop-types";

const commonPropTypes = {
    getRowData: PropTypes.func.isRequired,
    getRowKey: PropTypes.func,
    getRowExtraProps: PropTypes.func,
    className: PropTypes.string,
    RowComponent: PropTypes.elementType,
    fixedSize: PropTypes.bool,
    rows: PropTypes.object,
    overscanRowsCount: PropTypes.number,
    estimatedRowHeight: PropTypes.number
};

export default commonPropTypes;