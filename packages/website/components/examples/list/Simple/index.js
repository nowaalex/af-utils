import { memo } from "react";
import {
    useVirtual,
    areItemPropsEqual,
    List
} from "@af-utils/react-virtual-list";

const Item = memo(
    ({ i, model }) => (
        <div
            ref={el => model.el(i, el)}
            className="border-t p-2 border-zinc-400"
        >
            row {i}
        </div>
    ),
    areItemPropsEqual
);

const SimpleList = () => {
    const model = useVirtual({
        itemCount: 50000
    });

    return <List model={model}>{Item}</List>;
};

export default SimpleList;
