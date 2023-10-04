import { useRef } from "react";
import VirtualScroller from "models/VirtualScroller";
import type { VirtualScrollerInitialParams } from "types";

const useVirtualModel = (params: VirtualScrollerInitialParams) =>
    (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
