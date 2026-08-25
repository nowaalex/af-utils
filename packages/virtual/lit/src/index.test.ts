import { html, LitElement } from "lit";
import { ref } from "lit/directives/ref.js";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
    VirtualController,
    virtualGridItem,
    virtualRange,
    virtualItem
} from ".";

class NoopResizeObserver implements ResizeObserver {
    /** Ignore one observation in deterministic DOM tests. */
    observe() {}
    /** Ignore one unobserve operation in deterministic DOM tests. */
    unobserve() {}
    /** Ignore observer disconnection in deterministic DOM tests. */
    disconnect() {}
}

globalThis.ResizeObserver = NoopResizeObserver;

class TestHost extends LitElement {
    count = 10;
    estimatedItemSize = 40;
    readonly virtual = new VirtualController(this, () => ({
        estimatedItemSize: this.estimatedItemSize,
        itemCount: this.count
    }));

    protected render() {
        return html`${virtualRange(
            this.virtual.model,
            index => html`<span>${index}</span>`
        )}`;
    }
}

customElements.define("virtual-lit-test-host", TestHost);

class ItemTestHost extends LitElement {
    readonly virtual = new VirtualController(this, () => ({ itemCount: 1 }));

    protected render() {
        return html`<div ${virtualItem(this.virtual.model, 0)}>item</div>`;
    }
}

customElements.define("virtual-lit-item-test-host", ItemTestHost);

class LayoutTestHost extends LitElement {
    readonly virtual = new VirtualController(this, () => ({ itemCount: 10 }));

    protected render() {
        return html`<div ${ref(this.virtual.scrollerRef)} data-scroller>
            <div ${ref(this.virtual.sizeRef)} data-size>
                <div ${ref(this.virtual.itemsRef)} data-items></div>
            </div>
        </div>`;
    }
}

customElements.define("virtual-lit-layout-test-host", LayoutTestHost);

class GridTestHost extends LitElement {
    readonly rows = new VirtualController(this, () => ({ itemCount: 2 }));
    readonly columns = new VirtualController(this, () => ({
        horizontal: true,
        itemCount: 2
    }));

    protected render() {
        return html`${[0, 1].flatMap(row =>
            [0, 1].map(
                column => html`<div
                    ${virtualGridItem(
                        this.rows.model,
                        row,
                        this.columns.model,
                        column
                    )}
                ></div>`
            )
        )}`;
    }
}

customElements.define("virtual-lit-grid-test-host", GridTestHost);

class KeyedTestHost extends LitElement {
    items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    readonly virtual = new VirtualController(this, () => ({
        itemCount: this.items.length
    }));

    protected render() {
        return html`${virtualRange(
            this.virtual.model,
            index => html`<span data-id=${this.items[index].id}></span>`,
            index => this.items[index].id
        )}`;
    }
}

customElements.define("virtual-lit-keyed-test-host", KeyedTestHost);

describe("Lit virtual adapter", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    test("synchronizes host updates and model events", async () => {
        const host = new TestHost();
        document.body.append(host);
        await host.updateComplete;
        expect(host.virtual.model.itemCount).toBe(10);

        host.count = 20;
        host.requestUpdate();
        await host.updateComplete;
        expect(host.virtual.model.itemCount).toBe(20);

        host.virtual.model.setItemCount(1);
        await new Promise(resolve => {
            setTimeout(resolve, 0);
        });
        expect(host.renderRoot.querySelectorAll("span")).toHaveLength(1);
    });

    test("makes unchanged runtime synchronization a no-op", async () => {
        const host = new TestHost();
        document.body.append(host);
        await host.updateComplete;
        const revision = host.virtual.model.getRevision();

        host.requestUpdate();
        await host.updateComplete;
        expect(host.virtual.model.getRevision()).toBe(revision);

        host.count = 100;
        host.estimatedItemSize = 48;
        host.requestUpdate();
        await host.updateComplete;
        expect(host.virtual.model.getSize(99)).toBe(48);
    });

    test("keeps an item attached across unchanged host renders", async () => {
        const host = new ItemTestHost();
        const attachSpy = vi.spyOn(host.virtual.model, "attachItem");
        const detachSpy = vi.spyOn(host.virtual.model, "detachItem");
        document.body.append(host);
        await host.updateComplete;
        expect(attachSpy).toHaveBeenCalledOnce();

        host.requestUpdate();
        await host.updateComplete;
        expect(attachSpy).toHaveBeenCalledOnce();
        expect(detachSpy).not.toHaveBeenCalled();
    });

    test("observes only the first virtual grid row and column", async () => {
        const host = new GridTestHost();
        const rowsAttach = vi.spyOn(host.rows.model, "attachItem");
        const columnsAttach = vi.spyOn(host.columns.model, "attachItem");

        document.body.append(host);
        await host.updateComplete;

        expect(rowsAttach).toHaveBeenCalledTimes(2);
        expect(columnsAttach).toHaveBeenCalledTimes(2);
    });

    test("connects layout refs used as Lit element directives", async () => {
        const host = new LayoutTestHost();
        document.body.append(host);
        await host.updateComplete;

        const scroller =
            host.renderRoot.querySelector<HTMLElement>("[data-scroller]");
        const size = host.renderRoot.querySelector<HTMLElement>("[data-size]");
        const items =
            host.renderRoot.querySelector<HTMLElement>("[data-items]");

        expect(scroller?.style.overflow).toBe("auto");
        expect(scroller?.style.contain).toBe("strict");
        expect(size?.style.position).toBe("relative");
        expect(items?.style.position).toBe("absolute");
    });

    test("preserves keyed item DOM when its index changes", async () => {
        const host = new KeyedTestHost();
        document.body.append(host);
        await host.updateComplete;
        const retained = host.renderRoot.querySelector('[data-id="a"]');

        host.items = [host.items[2], host.items[1], host.items[0]];
        host.requestUpdate();
        await host.updateComplete;

        expect(host.renderRoot.querySelector('[data-id="a"]')).toBe(retained);
    });

    test("disposes its model when the host disconnects", async () => {
        const host = new TestHost();
        const model = host.virtual.model;
        const disposeSpy = vi.spyOn(model, "dispose");
        document.body.append(host);
        await host.updateComplete;
        host.remove();
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
        expect(disposeSpy).toHaveBeenCalledOnce();
    });

    test("recreates model and layout after a completed disconnect", async () => {
        const host = new LayoutTestHost();
        document.body.append(host);
        await host.updateComplete;
        const firstModel = host.virtual.model;

        host.remove();
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => resolve());
        });
        document.body.append(host);
        await host.updateComplete;

        expect(host.virtual.model).not.toBe(firstModel);
        expect(() => host.virtual.model.setItemCount(20)).not.toThrow();
        const size = host.renderRoot.querySelector<HTMLElement>("[data-size]");
        expect(size?.style.height).toBe("800px");
    });

    test("preserves its model across a transient DOM move", async () => {
        const host = new TestHost();
        const disposeSpy = vi.spyOn(host.virtual.model, "dispose");
        document.body.append(host);
        await host.updateComplete;

        host.remove();
        document.body.append(host);
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                resolve();
            });
        });

        expect(disposeSpy).not.toHaveBeenCalled();
    });
});
