import { VerticalList, useVirtual } from "af-virtual-scroll";
import styled from "styled-components";

const StyledList = styled(VerticalList)`
    min-width: 200px;
    max-width: 400px;
    min-height: 0;
    flex: 1 1 auto;
`

const SimpleList = () => {

    const model = useVirtual({
        itemCount: 50000,
        fixed: true
    });

    return (
        <StyledList model={model}>
            {i => (
                <div style={{ padding: "0.5em" }} key={i}>
                    row {i}
                </div>
            )}
        </StyledList>
    );
}

export default SimpleList;