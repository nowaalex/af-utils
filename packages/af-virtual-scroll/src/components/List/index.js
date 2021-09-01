import { memo } from "react";
import PropTypes from "prop-types";

import Rows from "../common/Rows";
import Container from "../common/Container";

const List = ({ children, ...props }) => (
    <Container {...props}>
        {model => <Rows model={model}>{children}</Rows>}
    </Container>
);

List.propTypes = {
    /**
     * @param {number} rowIndex
     * @returns {any} one row element child. Fragments are not supported.
     */
    children: PropTypes.func.isRequired
}

export default memo( List );