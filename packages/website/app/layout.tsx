import Script from "next/script";
import { Exo as createFont } from "next/font/google";
import type { ReactNode } from "react";
import "styles/globals.css";

const ID = "P68JT3P";

type RootLayoutProps = {
    children: ReactNode;
};

// If loading a variable font, you don't need to specify the font weight
const font = createFont({ subsets: ["latin"] });

const RootLayout = ({ children }: RootLayoutProps) => (
    <html lang="en" className={font.className}>
        <head>
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
                    ></iframe>
                </noscript>
            ) : null}
            {children}
        </body>
    </html>
);

export default RootLayout;
