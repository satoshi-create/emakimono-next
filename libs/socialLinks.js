import { GitHub, Twitter, Youtube, Linkedin } from "react-feather";
import NoteIcon from "../public/note-icon.png";
import Image from "next/image";

{/* <Image priority src={NoteIcon} alt="Follow us on Twitter" /> */}

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
  {
    name: "note",
    icon:  <Image src={NoteIcon} alt="Follow us on Twitter" width="25px" height="25px"/> ,
    path: "https://note.com/enjoy_emakimono",
  },
  {
    name: "twitter",
    icon: <Twitter />,
    path: "https://twitter.com/enjoy_emakimono",
  },
  // {
  //   name: "youtube",
  //   icon: <Youtube />,
  //   path: "https://www.youtube.com/channel/UC9w0YkVuUVe-_xtVbKluTbw",
  // },
];
