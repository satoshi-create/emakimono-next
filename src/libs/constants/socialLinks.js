import Image from "next/image";
import { GitHub, Youtube } from "react-feather";
import NoteIcon from "../../../public/note-icon.png";

export const socialLinks = [
  {
    name: "github",
    icon: <GitHub />,
    path: "https://github.com/satoshi-create/",
    title: "GitHub",
  },
  {
    name: "twitter",
    icon: <Image src="/svg/x.svg" alt="Follow us on Twitter" width="25px" height="25px" />,
    path: "https://twitter.com/enjoy_emakimono",
    title: "X（Twitter）",
  },
  {
    name: "youtube",
    icon: <Youtube />,
    path: "https://www.youtube.com/channel/UC9w0YkVuUVe-_xtVbKluTbw",
    title: "youtube",
  },
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
    title: "note",
  },
];
