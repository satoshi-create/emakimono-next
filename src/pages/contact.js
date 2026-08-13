import { getContactUrl } from "@/libs/constants/links";

export async function getServerSideProps({ locale }) {
  return {
    redirect: {
      destination: getContactUrl(locale),
      permanent: false,
    },
  };
}

export default function Contact() {
  return null;
}
