import { useRef } from "react";
import List, { ListInitialParams } from "models/List";

const useVirtualModel = (params: ListInitialParams): List =>
    (useRef<List>().current ||= new List(params));

export default useVirtualModel;
