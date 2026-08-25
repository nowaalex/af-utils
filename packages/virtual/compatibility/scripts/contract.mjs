export const adapters = [
    {
        id: "react",
        packageName: "@af-utils/virtual-react",
        peerName: "react",
        companionDependencies: version => ({
            "@types/react": version,
            "react-dom": version
        }),
        exports: ["useVirtual", "useVirtualItemRef", "VirtualList"]
    },
    {
        id: "preact",
        packageName: "@af-utils/virtual-preact",
        peerName: "preact",
        exports: ["useVirtual", "useVirtualItemRef", "VirtualList"]
    },
    {
        id: "solid",
        packageName: "@af-utils/virtual-solid",
        peerName: "solid-js",
        exports: ["createVirtual", "createVirtualItemRef", "VirtualList"]
    },
    {
        id: "svelte",
        packageName: "@af-utils/virtual-svelte",
        peerName: "svelte",
        exports: ["createVirtual", "virtualItem", "createVirtualList"]
    },
    {
        id: "lit",
        packageName: "@af-utils/virtual-lit",
        peerName: "lit",
        exports: ["VirtualController", "virtualItem", "virtualRange"]
    },
    {
        id: "vue",
        packageName: "@af-utils/virtual-vue",
        peerName: "vue",
        exports: ["useVirtual", "virtualItemDirective", "VirtualList"]
    }
];
