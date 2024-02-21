import Script from "next/script";
import { Exo as createFont } from "next/font/google";
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

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="en" className={font.className}>
        <head>
            {process.env.NODE_ENV === "production" ? (
                <>
                    <Script
                        async
                        src="https://www.googletagmanager.com/gtag/js?id=G-CBQ8S96MEK"
                    ></Script>
                    <Script id="google-analytics">
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
        <body className="bg-[#fafafa]">{children}</body>
    </html>
);

export default RootLayout;
