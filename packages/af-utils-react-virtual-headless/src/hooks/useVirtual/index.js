import { useEffect } from "react";
import useVirtualModel from "../useVirtualModel";

const useVirtual = params => {
    const model = useVirtualModel(params);

    useEffect(() => {
        /*
            startBatch/endBatch needed here not only for perf,
            but also for subscription forceUpdate queue call
        */
        model._startBatch();
        model.setHorizontal(params.horizontal);
        model.setItemCount(params.itemCount);
        model._endBatch();
    });

    return model;
};

export default useVirtual;
