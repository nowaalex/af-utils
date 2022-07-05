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

const getEstimatedItemSize = (oldItemSizes, oldScrollSize) =>
    oldItemSizes.length ? Math.round(oldScrollSize / oldItemSizes.length) : 75;

const HorizontalList = () => {
    const model = useVirtual({
        itemCount: 50000,
        getEstimatedItemSize,
        horizontal: true
    });

    return (
        <List model={model} className="h-full">
            {Item}
        </List>
    );
};

export default HorizontalList;
