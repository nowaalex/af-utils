import { useRef } from "react";
import List from "models/List";
import { DEFAULT_ESTIMATED_WIDGET_SIZE } from "constants";
import mergeModelParams from "/utils/mergeModelParams";

const useVirtualModel = params =>
    (useRef().current ||= mergeModelParams(
        new List(params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE),
        params
    ));

export default useVirtualModel;
