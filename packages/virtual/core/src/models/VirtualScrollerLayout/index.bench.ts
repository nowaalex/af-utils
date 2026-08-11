import "../../polyfill";
import { bench } from "vitest";
import VirtualScroller from "../VirtualScroller";
import VirtualScrollerLayout from ".";

const model = new VirtualScroller({
    estimatedItemSize: 40,
    estimatedWidgetSize: 600,
    itemCount: 100_000
});
const layout = new VirtualScrollerLayout(model) as unknown as {
    _itemsElement: { style: Record<string, string> };
    _updateItems(): void;
};
layout._itemsElement = { style: {} };

bench("synchronize rendered range styles", () => {
    layout._updateItems();
});
