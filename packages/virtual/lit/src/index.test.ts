import { VirtualScrollerEvent } from "@af-utils/virtual-core";
import { html, LitElement } from "lit";
import { afterEach, describe, expect, test, vi } from "vitest";
import { VirtualController, VirtualSnapshotController, virtualItem } from ".";

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
    readonly snapshot = new VirtualSnapshotController(
        this,
        this.virtual.model,
        VirtualScrollerEvent.ALL
    );
}

customElements.define("virtual-lit-test-host", TestHost);

class ItemTestHost extends LitElement {
    readonly model = new VirtualController(this, () => ({ itemCount: 1 }))
        .model;

    protected render() {
        return html`<div ${virtualItem(this.model, 0)}>item</div>`;
    }
}

customElements.define("virtual-lit-item-test-host", ItemTestHost);

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

        const requestUpdateSpy = vi.spyOn(host, "requestUpdate");
        host.virtual.model.setItemCount(30);
        expect(requestUpdateSpy).toHaveBeenCalled();
    });

    test("only synchronizes changed runtime parameters", async () => {
        const host = new TestHost();
        document.body.append(host);
        await host.updateComplete;
        const setSpy = vi.spyOn(host.virtual.model, "set");

        host.requestUpdate();
        await host.updateComplete;
        expect(setSpy).not.toHaveBeenCalled();

        host.estimatedItemSize = 48;
        host.requestUpdate();
        await host.updateComplete;
        expect(setSpy).toHaveBeenCalledOnce();
        expect(setSpy).toHaveBeenCalledWith({
            estimatedItemSize: 48,
            itemCount: 10
        });
    });

    test("keeps an item attached across unchanged host renders", async () => {
        const host = new ItemTestHost();
        const attachSpy = vi.spyOn(host.model, "attachItem");
        const detachSpy = vi.spyOn(host.model, "detachItem");
        document.body.append(host);
        await host.updateComplete;
        expect(attachSpy).toHaveBeenCalledOnce();

        host.requestUpdate();
        await host.updateComplete;
        expect(attachSpy).toHaveBeenCalledOnce();
        expect(detachSpy).not.toHaveBeenCalled();
    });

    test("disposes its model when the host disconnects", async () => {
        const host = new TestHost();
        const disposeSpy = vi.spyOn(host.virtual.model, "dispose");
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
