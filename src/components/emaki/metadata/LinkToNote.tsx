import styles from "@/styles/LinkToNote.module.css";
import Image from "next/image";
import Link from "next/link";

// Define the type
export type NoteDataEntry = {
  name: string;
  publishAt: string; // Or Date if you parse it
  eyecatch: string; // Path fragment for the image
  noteUrl: string;
  relatedEmakis: string; // A comma-separated string of emaki titles
  subtitle?: string; // Optional subtitle
};

// Define Props Interface
interface LinkToNoteProps {
  reletedEmakisToNote: NoteDataEntry[];
}

const LinkToNote = ({ reletedEmakisToNote }: LinkToNoteProps) => {
  // const reletedEmakisToNote = noteData.filter((item) =>
  //   item.relatedEmakis.includes(title)
  // );

  return (
    <div className={styles.container}>
      {reletedEmakisToNote.map((item, i) => {
        const { name, eyecatch, noteUrl } = item;
        return (
          <Link key={i} href={noteUrl}>
            <a target="_blank" rel="noopener noreferrer" className={styles.box}>
              {/* CORSエラーのため画像をnoteからfetchできない */}
              <Image
                src={`/${eyecatch}.webp`}
                alt={name}
                width={1280}
                height={670}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
              {/* <h4 className={styles.title}>{item.name}</h4>
              <small>{item.publishAt}</small> */}

              {/* <p className={styles.subtitle}>～{item.subtitle}～</p> */}
            </a>
          </Link>
        );
      })}
    </div>
  );
};

export default LinkToNote;
