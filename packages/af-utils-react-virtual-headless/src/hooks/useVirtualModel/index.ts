import { useRef } from "react";
import VirtualScroller, {
    VirtualScrollerInitialParams
} from "models/VirtualScroller";

const useVirtualModel = (params: VirtualScrollerInitialParams) =>
    (useRef<VirtualScroller>().current ||= new VirtualScroller(params));

export default useVirtualModel;
