import Script from "next/script";
import { Exo as createFont } from "next/font/google";
import mergeWith from "lodash/mergeWith";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "styles/globals.css";

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_ORIGIN as string),
    alternates: {
        canonical: "./"
    },
    title: "af-utils | Simple open-source tools that just work",
    description:
        "Simple and powerful tools that solve everyday problems (virtual scroll, scrollend polyfill, etc.) written in typescript",
    openGraph: {
        type: "website",
        title: "Simple open-source tools that just work",
        description:
            "Simple and powerful tools that solve everyday problems (virtual scroll, scrollend polyfill, etc.) written in typescript"
    },
    twitter: {
        creator: "@fominalex24",
        site: "@fominalex24"
    },
    verification: {
        google: "7SCiNq_CFCadLWK2XGowuH1UViEKIciYdit7apdjDVg"
    }
} as const satisfies Metadata;

// If loading a variable font, you don't need to specify the font weight
const font = createFont({ subsets: ["latin"] });

const CSP = [
    {
        "default-src": "'self'",
        "img-src": "'self' data: w3.org/svg/2000"
    },
    {
        "font-src": "fonts.gstatic.com",
        "style-src": "'unsafe-inline' fonts.googleapis.com"
    },
    {
        "script-src":
            "'unsafe-inline' https://*.googletagmanager.com" +
            (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
        "img-src":
            "https://*.google-analytics.com https://*.googletagmanager.com",
        "connect-src":
            "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com"
    }
].reduce((acc, obj) =>
    mergeWith(acc, obj, (v, v2) => (v || "'self'") + " " + v2)
);

const cspString = Object.entries(CSP)
    .map(([k, v]) => `${k} ${v};`)
    .join(" ");

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="en" className={font.className}>
        <head>
            <meta httpEquiv="Content-Security-Policy" content={cspString} />
            {process.env.NODE_ENV === "production" ? (
                <>
                    <Script
                        strategy="lazyOnload"
                        src="https://www.googletagmanager.com/gtag/js?id=G-CBQ8S96MEK"
                    ></Script>
                    <Script id="google-analytics" strategy="lazyOnload">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-CBQ8S96MEK');
                        `}
                    </Script>
                </>
            ) : null}
        </head>
        <body>{children}</body>
    </html>
);

export default RootLayout;
