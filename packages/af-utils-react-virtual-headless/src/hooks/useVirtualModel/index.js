import List from "models/List";
import {
    DEFAULT_OVERSCAN_COUNT,
    DEFAULT_ESTIMATED_WIDGET_SIZE
} from "constants";

import useOnce from "../useOnce";

const useVirtualModel = ({
    itemCount = 0,
    getEstimatedItemSize,
    estimatedWidgetSize = DEFAULT_ESTIMATED_WIDGET_SIZE,
    overscanCount = DEFAULT_OVERSCAN_COUNT,
    horizontal
}) =>
    useOnce(() => {
        const model = new List();

        model.setOverscan(overscanCount);
        model.setHorizontal(!!horizontal);
        model.setItemCount(itemCount, getEstimatedItemSize);
        model.setWidgetSize(estimatedWidgetSize);

        return model;
    });

export default useVirtualModel;
