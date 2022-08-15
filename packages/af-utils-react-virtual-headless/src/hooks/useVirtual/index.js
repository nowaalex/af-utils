import { useLayoutEffect, useEffect } from "react";
import useVirtualModel from "../useVirtualModel";
import mergeModelParams from "/utils/mergeModelParams";
import Batch from "/singletons/Batch";

const localUseEffect = process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;

const useVirtual = params => {
    const model = useVirtualModel(params);

    localUseEffect(() => {
        Batch._start();
        mergeModelParams(model, params);
        Batch._end();
    });

    return model;
};

export default useVirtual;
