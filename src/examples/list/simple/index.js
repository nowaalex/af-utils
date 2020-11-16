import List from "af-virtual-scroll/List";
import styled from "styled-components";

const StyledList = styled(List)`
    height: 400px;
    width: 400px;
`;

const SimpleList = () => (
    <StyledList
        getRowData={i => `row ${i}`}
        rowsQuantity={1000}
    />
);

export default SimpleList;