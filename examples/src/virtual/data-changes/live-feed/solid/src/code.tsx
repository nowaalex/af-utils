import {
    createVirtual,
    createVirtualItemRef,
    VirtualList,
    type ListItemProps
} from "@af-utils/virtual-solid";
import { createEffect, createSignal } from "solid-js";
import css from "./style.module.css";

interface Message {
    id: number;
    padding: number;
    text: string;
}

const INITIAL_COUNT = 200;
const createMessage = (id: number): Message => ({
    id,
    padding: 8 + ((id * 13) % 18),
    text: `Message ${id}`
});

const Item = (props: ListItemProps<Message[]>) => {
    const message = () => props.data?.[props.index()];

    return (
        <div
            ref={createVirtualItemRef(props.model, props.index)}
            class={css.item}
            role="listitem"
            aria-posinset={props.index() + 1}
            aria-setsize={props.model.itemCount}
            style={{ "padding-block": `${message()?.padding}px` }}
        >
            {message()?.text}
        </div>
    );
};

const LiveFeed = () => {
    const [messages, setMessages] = createSignal(
        Array.from({ length: INITIAL_COUNT }, (_, id) => createMessage(id))
    );
    const model = createVirtual(() => ({
        estimatedItemSize: 52,
        itemCount: messages().length
    }));
    let shouldFollowEnd = true;

    createEffect(() => {
        const lastIndex = messages().length - 1;
        if (shouldFollowEnd) {
            requestAnimationFrame(() => model.scrollToIndex(lastIndex));
        }
    });

    const appendMessage = () => {
        shouldFollowEnd = model.to === model.itemCount;
        setMessages(current => current.concat(createMessage(current.length)));
    };

    return (
        <div class={css.example}>
            <div class={css.toolbar}>
                <button type="button" onClick={appendMessage}>
                    Append message
                </button>
                <button
                    type="button"
                    onClick={() => model.scrollToIndex(messages().length - 1)}
                >
                    Jump to latest
                </button>
                <output class={css.status}>{messages().length} messages</output>
            </div>
            <VirtualList
                class={css.list}
                model={model}
                itemData={messages()}
                getItemKey={index => messages()[index]?.id ?? index}
                role="list"
                aria-label="Live message feed"
            >
                {Item}
            </VirtualList>
        </div>
    );
};

export default LiveFeed;
