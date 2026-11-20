import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PolaroidBoardView } from "@/components/emaki/viewer/polaroid/PolaroidBoardView";

export default function PolaroidBoardPage() {
  const router = useRouter();
  const isEn = router.locale === "en";

  const pageTitle = isEn
    ? "Emaki Polaroid Board | emakimono.com"
    : "絵巻ポラロイド・ホワイトボード | 絵巻物ビューアー";
  const pageDesc = isEn
    ? "Collect your favorite scenes from Japanese emaki scrolls, arrange them on a whiteboard, add notes, and share."
    : "絵巻物のお気に入りシーンをポラロイドで切り抜き、ホワイトボードに並べて観察メモや共有ができる個人図録ボードです。";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="noindex" />
      </Head>
      <PolaroidBoardView/>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
}