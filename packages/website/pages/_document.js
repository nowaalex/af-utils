import Document, { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

const ID = "P68JT3P";
class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
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
                </Head>
                <body>
                    {process.env.NODE_ENV === "production" ? (
                        <noscript
                            dangerouslySetInnerHTML={{
                                __html: `<iframe
                                src="https://www.googletagmanager.com/ns.html?id=GTM-${ID}"
                                height="0"
                                width="0"
                                style="display:none;visibility:hidden"
                            ></iframe>`
                            }}
                        />
                    ) : null}
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
