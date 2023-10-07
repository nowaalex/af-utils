import { useRef } from "react";
import { VirtualScroller } from "@af-utils/virtual-core";

const useVirtualModel = (
    params: ConstructorParameters<typeof VirtualScroller>[0]
) => (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
