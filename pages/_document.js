import Document, { Html, Head, Main, NextScript } from "next/document";

const googleTagManagerId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "";

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
          <link
            href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;500;700&family=Kaisei+HarunoUmi:wght@400;500;700&family=Noto+Sans+JP:wght@300;400;500&family=Zen+Kurenaido&family=Zen+Maru+Gothic:wght@300;400;500;700&display=swap&family=Noto+Serif+JP&display=swap&family=Noto+Serif+JP&family=Zen+Kaku+Gothic+New&family=Shippori+Mincho&family=Yomogi&display=swap&family=Shippori+Mincho&display=swap&family=Hina+Mincho&family=Shippori+Mincho&display=swap&family=Caveat:wght@400..700&family=Dancing+Script:wght@400..700&family=Noto+Serif+JP:wght@200..900&family=RocknRoll+One&display=swap')"
            rel="stylesheet"
          />
        </Head>
        <body>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}"
                height="0"
                width="0"
                style="display:none;visibility:hidden"
              />`,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
