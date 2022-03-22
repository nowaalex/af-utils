import { useEffect } from "react";
import List from "models/List";
import useOnce from "../useOnce";
import { EMPTY_ARRAY } from "constants";

const useVirtualModel = ({
    itemCount = 0,
    estimatedItemSize = 40,
    estimatedWidgetSize = 200,
    overscanCount = 3,
    horizontal = false
}) => {
    const model = useOnce(() => {
        const model = new List();

        /* StartBatch/EndBatch are not needed, because no subscriptions could exist here */
        model.setSecondaryParams(estimatedItemSize, overscanCount);
        model.setHorizontal(horizontal);
        model.setItemCount(itemCount);
        model.setWidgetSize(estimatedWidgetSize);

        return model;
    });

    model.setSecondaryParams(estimatedItemSize, overscanCount);

    useEffect(() => () => model._destroy(), EMPTY_ARRAY);

    return model;
};

export default useVirtualModel;
