import { memo } from "react";
import {
    useVirtual,
    areItemPropsEqual,
    List
} from "@af-utils/react-virtual-list";

const Item = memo(
    ({ i }) => (
        <div
            className={`
        p-4
        leading-[5em]
        whitespace-nowrap
        ${i % 2 ? "bg-orange-400" : "bg-orange-700"}
    `}
        >
            col {i}
        </div>
    ),
    areItemPropsEqual
);

const HorizontalList = () => {
    const model = useVirtual({
        itemCount: 50000,
        estimatedItemSize: 75,
        horizontal: true
    });

    return (
        <List model={model} className="h-min">
            {Item}
        </List>
    );
};

export default HorizontalList;
