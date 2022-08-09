import { useLayoutEffect, useEffect } from "react";
import useVirtualModel from "../useVirtualModel";
import { DEFAULT_OVERSCAN_COUNT, DEFAULT_ESTIMATED_ITEM_SIZE } from "constants";

const localUseEffect = process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;

const useVirtual = params => {
    const model = useVirtualModel(params);

    /*
        overscanCount can't be subscribed, so no sense to update it in effect.
    */
    model.setOverscan(params.overscanCount ?? DEFAULT_OVERSCAN_COUNT);

    localUseEffect(() => {
        model._startBatch();
        model.setHorizontal(!!params.horizontal);
        model.setItemCount(
            params.itemCount,
            params.estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE
        );
        model._endBatch();
    });

    return model;
};

export default useVirtual;
