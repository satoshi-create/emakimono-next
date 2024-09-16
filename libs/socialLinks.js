import {
  GitHub,
  Twitter,
  Youtube,
  Linkedin,
  Settings,
  HelpCircle,
} from "react-feather";
import NoteIcon from "../public/note-icon.png";
import Image from "next/image";

{
  /* <Image priority src={NoteIcon} alt="Follow us on Twitter" /> */
}

export const socialLinks = [
  // {
  //   name: "Linkedin",
  //   icon: <Linkedin />,
  //   path: "https://www.linkedin.com/in/satoprofile/",
  // },
  // {
  //   name: "github",
  //   icon: <GitHub />,
  //   path: "https://github.com/satoshi-create",
  // },
  // {
  //   name: "help",
  //   icon: <HelpCircle />,
  //   path: "https://note.com/enjoy_emakimono/n/n449f765b4876",
  //   title: "「横スクロールで楽しむ絵巻物」の使い方",
  // },
  // {
  //   name: "how to use",
  //   icon: <Settings />,
  //   path: "https://note.com/enjoy_emakimono/n/n449f765b4876",
  //   title: "「横スクロールで楽しむ絵巻物」の使い方",
  // },
  {
    name: "note",
    icon: (
      <Image
        src={NoteIcon}
        alt="Follow us on Twitter"
        width="25px"
        height="25px"
      />
    ),
    path: "https://note.com/enjoy_emakimono",
    title: "note",
  },
  {
    name: "twitter",
    icon: <Twitter />,
    path: "https://twitter.com/enjoy_emakimono",
    title: "X（旧Twitter）",
  },
  // {
  //   name: "youtube",
  //   icon: <Youtube />,
  //   path: "https://www.youtube.com/channel/UC9w0YkVuUVe-_xtVbKluTbw",
  // },
];
