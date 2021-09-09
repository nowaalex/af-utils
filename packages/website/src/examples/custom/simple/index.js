import { Container, Rows } from "af-virtual-scroll";
import styled from "styled-components";

/*
    99% cases List/Table is enough.
    This can be used when:
        * Rows should be wrapped
        * some extra sticky stuff should be rendered before/after Rows.
*/

const StyledRowsWraper = styled.div`
    background: #333;
`;

const Custom = () => (
    <Container estimatedRowHeight={30} rowsQuantity={1000}>
        {model => (
            <StyledRowsWraper>
                <Rows model={model}>
                    {i => <div style={{ padding: "0.5em" }} key={i}>row {i}</div>}
                </Rows>
            </StyledRowsWraper> 
        )}
    </Container>
);

export default Custom;