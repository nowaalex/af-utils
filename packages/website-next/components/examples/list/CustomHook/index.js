import { Subscription, mapVisibleRange, useVirtual } from "af-virtual-scroll";

const CustomHook = () => {

    const model = useVirtual({
        itemCount: 50000,
    });

    return (
        <div className="overflow-auto" ref={model.setOuterNode}>
            <Subscription model={model}>
                {({ from, widgetScrollSize }) => {

                    const fromOffset = model.getOffset(from);

                    return (
                        <div 
                            className="divide-y divide-zinc-700"
                            style={{
                                marginTop: fromOffset,
                                height: widgetScrollSize - fromOffset
                            }}
                        >
                            <div ref={model.setZeroChildNode} hidden />
                            {mapVisibleRange( model, i => (
                                <div className={`p-4 ${ i % 2 ? "bg-orange-400" : "bg-orange-700"}`} key={i}>
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