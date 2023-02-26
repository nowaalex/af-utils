import { useLayoutEffect, useEffect } from "react";
import { ListInitialParams } from "models/List/types";
import useVirtualModel from "../useVirtualModel";

const localUseEffect = process.env.__IS_SERVER__ ? useEffect : useLayoutEffect;

const useVirtual = (params: ListInitialParams) => {
    const model = useVirtualModel(params);

    localUseEffect(() => model.set(params));

    return model;
};

export default useVirtual;
