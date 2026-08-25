import type { ListItemProps } from "@af-utils/virtual-preact";
import {
    VirtualList,
    useVirtual,
    useVirtualItemRef
} from "@af-utils/virtual-preact";
import {
    memo,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "preact/compat";
import css from "./style.module.css";

interface Message {
    id: number;
    padding: number;
    text: string;
}

const INITIAL_COUNT = 200;
const useBrowserLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;
const createMessage = (id: number): Message => ({
    id,
    padding: 8 + ((id * 13) % 18),
    text: `Message ${id}`
});

const Item = memo<ListItemProps<Message[]>>(({ model, index, data }) => {
    const messages = data as Message[];
    const message = messages[index];

    return (
        <div
            ref={useVirtualItemRef(model, index)}
            className={css.item}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={messages.length}
            style={{ paddingBlock: message.padding }}
        >
            {message.text}
        </div>
    );
});

const LiveFeed = () => {
    const [messages, setMessages] = useState(() =>
        Array.from({ length: INITIAL_COUNT }, (_, id) => createMessage(id))
    );
    const model = useVirtual({
        estimatedItemSize: 52,
        itemCount: messages.length
    });
    const shouldFollowEnd = useRef(true);

    useBrowserLayoutEffect(() => {
        if (shouldFollowEnd.current) {
            model.scrollToIndex(messages.length - 1);
        }
    }, [messages.length, model]);

    const appendMessage = () => {
        shouldFollowEnd.current = model.to === model.itemCount;
        setMessages(current => current.concat(createMessage(current.length)));
    };

    return (
        <div className={css.example}>
            <div className={css.toolbar}>
                <button type="button" onClick={appendMessage}>
                    Append message
                </button>
                <button
                    type="button"
                    onClick={() => model.scrollToIndex(messages.length - 1)}
                >
                    Jump to latest
                </button>
                <output className={css.status}>
                    {messages.length} messages
                </output>
            </div>
            <VirtualList
                className={css.list}
                model={model}
                itemData={messages}
                getItemKey={index => messages[index]?.id ?? index}
                role="list"
                aria-label="Live message feed"
            >
                {Item}
            </VirtualList>
        </div>
    );
};

export default LiveFeed;
