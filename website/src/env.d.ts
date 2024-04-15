/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_ORIGIN: string;
    readonly PUBLIC_TITLE_PREFIX: string;
    readonly PUBLIC_GITHUB_BRANCH: string;
    readonly PUBLIC_GITHUB_SUFFIX: string;
    readonly PUBLIC_DISCORD_LINK: string;
    readonly PUBLIC_GOOGLE_VERIFICATION: string;
    readonly PUBLIC_GTAG_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
