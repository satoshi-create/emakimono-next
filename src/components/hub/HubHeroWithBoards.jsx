import { LinkedPublicBoards } from "@/components/hub/LinkedPublicBoards";

export function HubHeroWithBoards({
  title,
  description,
  locale,
  boards,
  boardProps = {},
  media,
  children,
  styles = {},
}) {
  const boardList = Array.isArray(boards) ? boards : [];

  return (
    <section className={styles.hero || ""}>
      {media}
      <div className={styles.heroText || ""}>
        <h1 className={styles.introTitle || ""}>{title}</h1>
        {description ? (
          <p className={styles.introLead || ""}>{description}</p>
        ) : null}
        {children}
        {boardList.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <LinkedPublicBoards
              boards={boardList}
              locale={locale}
              {...boardProps}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}