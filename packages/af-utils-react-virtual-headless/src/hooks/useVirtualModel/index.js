import List from "models/List";
import { DEFAULT_ESTIMATED_WIDGET_SIZE } from "constants";
import mergeModelParams from "/utils/mergeModelParams";

import useOnce from "../useOnce";

const useVirtualModel = params =>
    useOnce(() => {
        const model = new List(
            params.estimatedWidgetSize ?? DEFAULT_ESTIMATED_WIDGET_SIZE
        );
        mergeModelParams(model, params);

        return model;
    });

export default useVirtualModel;
