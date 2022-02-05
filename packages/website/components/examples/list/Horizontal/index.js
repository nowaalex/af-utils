import { Subscription, mapVisibleRange, useVirtual } from "af-virtual-scroll";

const CustomHook = () => {

    const model = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return (
        <div className="overflow-auto h-min" ref={model.setOuterNode}>
            <Subscription model={model}>
                {({ from, scrollSize }) => {
                    const fromOffset = model.getOffset(from);

                    return (
                        <div 
                            className="flex divide-x divide-zinc-700"
                            style={{
                                marginLeft: fromOffset,
                                width: scrollSize - fromOffset
                            }}
                        >
                            <div ref={model.setZeroChildNode} hidden />
                            {mapVisibleRange( model, i => (
                                <div 
                                    key={i}
                                    className={`
                                        p-4
                                        leading-[5em]
                                        whitespace-nowrap
                                        ${ i % 2 ? "bg-orange-400" : "bg-orange-700"}
                                    `}
                                >
                                    row {i}
                                </div>
                            ))}
                        </div>
                    );
                }}
            </Subscription>
        </div>
    );
}

export default CustomHook;