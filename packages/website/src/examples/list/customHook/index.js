import { Subscription, mapVisibleRange, useVirtual } from "af-virtual-scroll";
import styled from "styled-components";

const StyledList = styled.div`
    overflow: auto;
    min-width: 200px;
    max-width: 400px;
    min-height: 0;
    flex: 1 1 auto;
`;

const StyledRow = styled.div`
    padding: 1em;
`;

const CustomHook = () => {

    const model = useVirtual({
        itemCount: 50000,
    });

    return (
        <StyledList model={model} ref={model.setOuterNode}>
            <Subscription model={model}>
                {({ from, widgetScrollSize }) => {

                    const fromOffset = model.getOffset(from);

                    return (
                        <div 
                            style={{
                                marginTop: fromOffset,
                                height: widgetScrollSize - fromOffset
                            }}
                        >
                            <div ref={model.setZeroChildNode} hidden />
                            {mapVisibleRange( model, i => <StyledRow key={i}>row {i}</StyledRow> )}
                        </div>
                    );
                }}
            </Subscription>
        </StyledList>
    );
}

export default CustomHook;