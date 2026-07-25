import { NOTION_CONTACT_URL } from "@/libs/constants/links";

export async function getServerSideProps() {
  return {
    redirect: {
      destination: NOTION_CONTACT_URL,
      permanent: false,
    },
  };
}

export default function Contact() {
  return null;
}
