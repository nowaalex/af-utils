import { useLayoutEffect, useEffect } from "react";
import useVirtualModel from "../useVirtualModel";
import Batch from "/singletons/Batch";
import { DEFAULT_OVERSCAN_COUNT, DEFAULT_ESTIMATED_ITEM_SIZE } from "constants";

const localUseEffect = process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;

const useVirtual = params => {
    const model = useVirtualModel(params);

    /*
        overscanCount can't be subscribed, so no sense to update it in effect.
    */
    model.setOverscan(params.overscanCount ?? DEFAULT_OVERSCAN_COUNT);

    localUseEffect(() => {
        Batch._start();
        model.setHorizontal(!!params.horizontal);
        model.setItemCount(
            params.itemCount,
            params.estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE
        );
        Batch._end();
    });

    return model;
};

export default useVirtual;
