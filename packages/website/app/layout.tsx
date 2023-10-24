import Script from "next/script";
import { Exo as createFont } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "styles/globals.css";

export const metadata = {
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
    }
} as const satisfies Metadata;

const ID = "P68JT3P";

// If loading a variable font, you don't need to specify the font weight
const font = createFont({ subsets: ["latin"] });

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="en" className={font.className}>
        <head>
            <meta
                name="google-site-verification"
                content="7SCiNq_CFCadLWK2XGowuH1UViEKIciYdit7apdjDVg"
            />
            {process.env.NODE_ENV === "production" ? (
                <Script
                    id="tag-manager"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-${ID}');`
                    }}
                ></Script>
            ) : null}
        </head>
        <body suppressHydrationWarning>
            {process.env.NODE_ENV === "production" ? (
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=GTM-${ID}`}
                        height="0"
                        width="0"
                        className="hidden invisible"
                    />
                </noscript>
            ) : null}
            {children}
        </body>
    </html>
);

export default RootLayout;
