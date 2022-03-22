import { memo } from "react";
import {
    useVirtual,
    areIndexesEqual,
    List
} from "@af-utils/react-virtual-list";

const Item = memo(
    ({ i }) => <div className="border-t p-2 border-zinc-400">row {i}</div>,
    areIndexesEqual
);

const SimpleList = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return <List model={model}>{Item}</List>;
};

export default SimpleList;
