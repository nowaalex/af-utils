import { DEFAULT_OVERSCAN_COUNT, DEFAULT_ESTIMATED_ITEM_SIZE } from "constants";

const mergeModelParams = (
    model,
    {
        overscanCount = DEFAULT_OVERSCAN_COUNT,
        horizontal = false,
        itemCount = 0,
        estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE
    }
) => {
    model.setOverscan(overscanCount);
    model.setHorizontal(horizontal);
    model.setItemCount(itemCount, estimatedItemSize);
};

export default mergeModelParams;
