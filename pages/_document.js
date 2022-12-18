import Document, { Html, Head, Main, NextScript } from "next/document";

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
            href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;500;700&family=Kaisei+HarunoUmi:wght@400;500;700&family=Noto+Sans+JP:wght@300;400;500&family=Zen+Kurenaido&family=Zen+Maru+Gothic:wght@300;400;500;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
