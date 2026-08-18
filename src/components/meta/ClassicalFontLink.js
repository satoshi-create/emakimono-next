import Head from "next/head";

/** 詞書オーバーレイと古典モノグラム専用。全ページの _document には載せない。 */
const HINA_MINCHO_HREF =
  "https://fonts.googleapis.com/css2?family=Hina+Mincho&display=swap";

const ClassicalFontLink = () => (
  <Head>
    <link
      key="hina-mincho"
      rel="stylesheet"
      href={HINA_MINCHO_HREF}
    />
  </Head>
);

export default ClassicalFontLink;
