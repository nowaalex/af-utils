import { useRef } from "react";
import List from "models/List";
import type { ListInitialParams, PublicList } from "models/List";

const useVirtualModel = (params: ListInitialParams): PublicList =>
    (useRef<PublicList>().current ||= new List(params));

export default useVirtualModel;
