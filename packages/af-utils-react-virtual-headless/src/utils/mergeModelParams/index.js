import { DEFAULT_OVERSCAN_COUNT, DEFAULT_ESTIMATED_ITEM_SIZE } from "constants";

const mergeModelParams = (model, params) => {
    model.setOverscan(params.overscanCount ?? DEFAULT_OVERSCAN_COUNT);
    model.setHorizontal(!!params.horizontal);
    model.setItemCount(
        params.itemCount || 0,
        params.estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE
    );
};

export default mergeModelParams;
