import Document, { Html, Head, Main, NextScript } from "next/document";
import * as gtag from "../libs/gtag";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* <link
            href="https://fonts.googleapis.com/css2?family=Inter&display=optional"
            rel="stylesheet"
          /> */}
          {/* Noto Sans Japaneseを追加 */}
          {/* <link
            href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;500;700&family=Kaisei+HarunoUmi:wght@400;500;700&family=Noto+Sans+JP:wght@300;400;500&family=Zen+Kurenaido&family=Zen+Maru+Gothic:wght@300;400;500;700&display=swap&family=Noto+Serif+JP&display=swap&family=Noto+Serif+JP&family=Zen+Kaku+Gothic+New&family=Shippori+Mincho&family=Yomogi&display=swap&family=Shippori+Mincho&display=swap&family=Hina+Mincho&family=Shippori+Mincho&display=swap&family=Caveat:wght@400..700&family=Dancing+Script:wght@400..700&family=Noto+Serif+JP:wght@200..900&family=RocknRoll+One&display=swap')"
            rel="stylesheet"

          /> */}

          {/* <link
            href="https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Hina+Mincho&family=Kaisei+Decol&family=Kaisei+HarunoUmi&family=Noto+Serif+JP&family=Shippori+Mincho&family=Yomogi&family=Zen+Kaku+Gothic+New&family=Zen+Kurenaido&family=Zen+Maru+Gothic&display=swap"
            rel="stylesheet"
          /> */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Zen+Kaku+Gothic+New&family=Zen+Kurenaido&family=Zen+Maru+Gothic&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          {/* <noscript
            dangerouslySetInnerHTML={{
              __html: `
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=${gtag.GTM_ID}"
                height="0"
                width="0"
                style="display:none;visibility:hidden"
              />`,
            }}
          /> */}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
