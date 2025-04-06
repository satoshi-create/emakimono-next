import { Twitter, Youtube } from "react-feather";
import NoteIcon from "../public/note-icon.png";
import Image from "next/image";

export const socialLinks = [
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
  {
    name: "twitter",
    icon: <Twitter />,
    path: "https://twitter.com/enjoy_emakimono",
    title: "X（Twitter）",
  },
];
