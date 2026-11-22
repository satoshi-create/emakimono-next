import { useEffect } from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function EmakiHubRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/type/emaki");
  }, [router]);

  return null;
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}