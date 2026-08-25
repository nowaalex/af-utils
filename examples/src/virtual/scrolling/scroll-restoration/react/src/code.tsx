import type { ListItemProps } from "@af-utils/virtual-react";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-react";
import { memo, useEffect, useLayoutEffect, useState } from "react";
import css from "./style.module.css";

const ITEM_COUNT = 50_000;
const useBrowserLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

const Item = memo<ListItemProps>(({ model, index }) => (
    <div
        ref={useVirtualItemRef(model, index)}
        className={css.item}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={ITEM_COUNT}
    >
        row {index}
    </div>
));

const RestorableList = ({
    initialPosition,
    onOpen
}: {
    initialPosition: number;
    onOpen(position: number): void;
}) => {
    const model = useVirtual({ estimatedItemSize: 48, itemCount: ITEM_COUNT });

    useBrowserLayoutEffect(() => {
        if (initialPosition > 0) model.scrollToIndex(initialPosition);
    }, [initialPosition, model]);

    return (
        <div className={css.example}>
            <div className={css.toolbar}>
                <button type="button" onClick={() => onOpen(model.visibleFrom)}>
                    Open details
                </button>
                <output className={css.status}>
                    Restored item {Math.floor(initialPosition)}
                </output>
            </div>
            <VirtualList
                className={css.list}
                model={model}
                role="list"
                aria-label="Restorable virtual list"
            >
                {Item}
            </VirtualList>
        </div>
    );
};

const ScrollRestoration = () => {
    const [savedPosition, setSavedPosition] = useState(0);
    const [detailsOpen, setDetailsOpen] = useState(false);

    if (detailsOpen) {
        return (
            <div className={css.details}>
                <p>
                    List is unmounted. Position {savedPosition.toFixed(2)}{" "}
                    saved.
                </p>
                <button type="button" onClick={() => setDetailsOpen(false)}>
                    Back to list
                </button>
            </div>
        );
    }

    return (
        <RestorableList
            initialPosition={savedPosition}
            onOpen={position => {
                setSavedPosition(position);
                setDetailsOpen(true);
            }}
        />
    );
};

export default ScrollRestoration;
