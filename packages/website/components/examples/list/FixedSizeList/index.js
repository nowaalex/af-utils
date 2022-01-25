import { VerticalList, useVirtual } from "af-virtual-scroll";

// import once in a project ( not needed for hook )
// import "af-virtual-scroll/lib/style.css";

const FixedSizeList = () => {

    const model = useVirtual({
        itemCount: 2000,
        fixed: true
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

export default FixedSizeList;