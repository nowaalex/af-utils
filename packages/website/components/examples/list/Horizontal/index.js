import { memo } from "react";
import { useVirtual, List } from "@af-utils/react-virtual-list";

const Item = memo(({ i, model }) => (
    <div
        ref={el => model.el(i, el)}
        className={`
        p-4
        leading-[5em]
        whitespace-nowrap
        ${i % 2 ? "bg-orange-400" : "bg-orange-700"}
    `}
    >
        col {i}
    </div>
));

const HorizontalList = () => {
    const cols = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return <List model={cols}>{Item}</List>;
};

export default HorizontalList;
