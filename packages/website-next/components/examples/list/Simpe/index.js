import { VerticalList, useVirtual } from "af-virtual-scroll";

const SimpleList = () => {

    const model = useVirtual({
        itemCount: 50000,
    });

    return (
        <VerticalList model={model}>
            {i => (
                <div className="border-t p-2 border-zinc-400" key={i}>
                    row {i}
                </div>
            )}
        </VerticalList>
    );
}

export default SimpleList;