export const readEnvironment = () =>
    globalThis.process?.env?.CHECK_HOT_FIXTURE ??
    globalThis.Deno?.env.get("CHECK_HOT_FIXTURE");
