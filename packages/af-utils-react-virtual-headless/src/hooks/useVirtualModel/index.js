import List from "models/List";
import useOnce from "../useOnce";

const useVirtualModel = ({
    itemCount = 0,
    // setItemCount already has default callback set
    getEstimatedItemSize,
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

    return model;
};

export default useVirtualModel;
