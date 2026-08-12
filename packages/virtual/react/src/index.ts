/**
 * @packageDocumentation
 * React components and hooks used to connect to `VirtualScroller`.
 */

export { default as List } from "./components/List";

export { default as useScroller } from "./hooks/useScroller";
export { default as useVirtual } from "./hooks/useVirtual";
export { default as useVirtualEffect } from "./hooks/useVirtualEffect";
// TODO: Expose React refs for VirtualScroller.setStickyHeader/setStickyFooter.
// Until that API is designed, sticky elements remain an explicit core-only API.
export {
    useVirtualGridItemRef,
    useVirtualItemRef
} from "./hooks/useVirtualItemRef";
export { default as useVirtualLayout } from "./hooks/useVirtualLayout";
export { default as useVirtualModel } from "./hooks/useVirtualModel";
export { default as useVirtualSnapshot } from "./hooks/useVirtualSnapshot";

export * from "./types";
