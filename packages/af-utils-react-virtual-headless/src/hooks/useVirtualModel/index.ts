import { useRef } from "react";
import List from "models/List";
import { ListInitialParams } from "models/List/types";

const useVirtualModel = (params: ListInitialParams) =>
    (useRef<List>().current ||= new List(params));

export default useVirtualModel;
