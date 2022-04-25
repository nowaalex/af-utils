import { useEffect } from "react";
import List from "models/List";
import getEstimatedItemSizeDefault from "utils/getEstimatedItemSize";
import useOnce from "../useOnce";
import { EMPTY_ARRAY } from "constants";

const useVirtualModel = ({
    itemCount = 0,
    getEstimatedItemSize = getEstimatedItemSizeDefault,
    estimatedWidgetSize = 200,
    overscanCount = 3,
    horizontal = false
}) => {
    const model = useOnce(() => {
        const model = new List();

        /* StartBatch/EndBatch are not needed, because no subscriptions could exist here */
        model.setOverscan(overscanCount);
        model.setHorizontal(horizontal);
        model.setItemCount(itemCount, getEstimatedItemSize);
        model.setWidgetSize(estimatedWidgetSize);

        return model;
    });

    model.setOverscan(overscanCount);

    useEffect(() => () => model._destroy(), EMPTY_ARRAY);

    return model;
};

export default useVirtualModel;
