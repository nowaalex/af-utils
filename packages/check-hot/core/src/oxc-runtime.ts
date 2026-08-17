/** Environment names read by Oxc's native/WASI binding selector. */
export const oxcNativeEnvironmentNames = [
    "NODE_ENV",
    "NAPI_RS_ENFORCE_VERSION_CHECK",
    "NAPI_RS_FORCE_WASI",
    "NAPI_RS_NATIVE_LIBRARY_PATH",
    "NAPI_RS_WASI_FLAVOR",
    "OXC_RESOLVER_YARN_PNP"
] as const;

/** Load Oxc and return the exact native artifacts Deno may access through FFI. */
export const discoverOxcNativeBindings = (localRequire: NodeJS.Require) => {
    void localRequire("oxc-parser");
    return Object.keys(localRequire.cache).filter(
        path =>
            path.endsWith(".node") &&
            (path.includes("@oxc-parser") || path.includes("@oxc-resolver"))
    );
};
