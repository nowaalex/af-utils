import { useRef } from "react";
import List from "models/List";

const useVirtualModel = params => (useRef().current ||= new List(params));

export default useVirtualModel;
