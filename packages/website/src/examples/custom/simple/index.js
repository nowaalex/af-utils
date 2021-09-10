import { Container, Rows, ExtraHeight } from "af-virtual-scroll";
import styled from "styled-components";

/*
    99% cases List/Table is enough.
    This can be used when:
        * Rows should be wrapped
        * some extra sticky stuff should be rendered before/after Rows.
        

    ExtraHeight is used to subtract sticky element height from scroll height
*/

const StyledRowsWraper = styled.div`
    background: #333;
`;

const StickyFooter = styled.div`
    position: sticky;
    bottom: 0;
    background: purple;
    padding: 1em;
`;

const StickyHeader = styled(StickyFooter)`
    top: 0;
`;

const Custom = () => (
    <Container estimatedRowHeight={30} rowsQuantity={1000}>
        {model => (
            <StyledRowsWraper>
                <ExtraHeight model={model}>
                    <StickyHeader>
                        I want to go up!
                    </StickyHeader>
                </ExtraHeight>
                <Rows model={model}>
                    {i => <div style={{ padding: "0.5em" }} key={i}>row {i}</div>}
                </Rows>
                <ExtraHeight model={model}>
                    <StickyFooter>
                        I want to go down!
                    </StickyFooter>
                </ExtraHeight>
            </StyledRowsWraper> 
        )}
    </Container>
);

export default Custom;