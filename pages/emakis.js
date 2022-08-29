import "lazysizes";
import emakisData from "../libs/data";
import Link from "next/link";

export default function emakis() {
  return (
    <div className="conteinter">
      {emakisData.map((item, index) => {
        const { titleen, title } = item;
        return (
          <div className="emaki-card" key={index}>
            <Link href={`/emakis/${titleen}`}>
              <a>{title}</a>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
