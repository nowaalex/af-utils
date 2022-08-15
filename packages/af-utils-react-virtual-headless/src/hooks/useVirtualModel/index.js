import { useRef } from "react";
import List from "models/List";
import { DEFAULT_ESTIMATED_WIDGET_SIZE } from "constants";
import mergeModelParams from "/utils/mergeModelParams";

const useVirtualModel = params => {
    const model = (useRef().current ||= new List(
        params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE
    ));
    mergeModelParams(model, params);

    return model;
};

export default useVirtualModel;
