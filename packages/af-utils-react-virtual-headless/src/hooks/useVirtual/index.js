import { useLayoutEffect } from "react";
import useVirtualModel from "../useVirtualModel";

const useVirtual = params => {
    const model = useVirtualModel(params);

    useLayoutEffect(() => {
        model._startBatch();
        model.setHorizontal(params.horizontal);
        model.setItemCount(params.itemCount, params.getEstimatedItemSize);
        model._endBatch();
    });

    return model;
};

export default useVirtual;
