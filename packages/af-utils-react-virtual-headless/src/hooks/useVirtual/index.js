import { useLayoutEffect, useEffect } from "react";
import useVirtualModel from "../useVirtualModel";

const localUseEffect = process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;

const useVirtual = params => {
    const model = useVirtualModel(params);

    localUseEffect(() => {
        model._startBatch();
        model.setHorizontal(params.horizontal);
        model.setItemCount(params.itemCount, params.getEstimatedItemSize);
        model._endBatch();
    });

    return model;
};

export default useVirtual;
