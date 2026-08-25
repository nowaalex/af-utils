import {
    VirtualController,
    virtualItem,
    virtualRange
} from "@af-utils/virtual-lit";
import { html, LitElement, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import css from "./style.module.css";
import stylesheet from "./style.module.css?inline";

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

export default class LiveFeed extends LitElement {
    static styles = unsafeCSS(stylesheet);

    private messages = Array.from({ length: INITIAL_COUNT }, (_, id) =>
        createMessage(id)
    );
    private shouldFollowEnd = true;
    private readonly virtual = new VirtualController(this, () => ({
        estimatedItemSize: 52,
        itemCount: this.messages.length
    }));

    connectedCallback() {
        super.connectedCallback();
        this.style.cssText = "display:block;width:100%;height:100%";
    }

    protected updated() {
        if (this.shouldFollowEnd) {
            this.virtual.model.scrollToIndex(this.messages.length - 1);
        }
    }

    private appendMessage() {
        const model = this.virtual.model;
        this.shouldFollowEnd = model.to === model.itemCount;
        this.messages = [...this.messages, createMessage(this.messages.length)];
        this.requestUpdate();
    }

    protected render() {
        const model = this.virtual.model;

        return html`<div class=${css.example}>
            <div class=${css.toolbar}>
                <button type="button" @click=${this.appendMessage}>
                    Append message
                </button>
                <button
                    type="button"
                    @click=${() =>
                        model.scrollToIndex(this.messages.length - 1)}
                >
                    Jump to latest
                </button>
                <output class=${css.status}
                    >${this.messages.length} messages</output
                >
            </div>
            <div
                ${ref(this.virtual.scrollerRef)}
                class=${css.list}
                role="list"
                aria-label="Live message feed"
            >
                <div ${ref(this.virtual.sizeRef)}>
                    <div ${ref(this.virtual.itemsRef)}>
                        ${virtualRange(
                            model,
                            index => {
                                const message = this.messages[index];
                                return html`<div
                                    ${virtualItem(model, index)}
                                    class=${css.item}
                                    role="listitem"
                                    aria-posinset=${index + 1}
                                    aria-setsize=${this.messages.length}
                                    style=${`padding-block:${message.padding}px`}
                                >
                                    ${message.text}
                                </div>`;
                            },
                            index => this.messages[index]?.id ?? index
                        )}
                    </div>
                </div>
            </div>
        </div>`;
    }
}

customElements.define("af-virtual-lit-live-feed", LiveFeed);
