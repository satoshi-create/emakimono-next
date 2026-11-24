import { Fragment } from "react";
import Title from "@/components/ui/Title";
import defaultStyles from "@/styles/ChoujuGigaHub.module.css";

export function HubScrollGridSection({
  title,
  scrolls = [],
  renderCard,
  styles,
  sectionClassName = "",
}) {
  const scrollSectionClass =
    styles?.scrollSection ?? defaultStyles.scrollSection ?? "";
  const scrollGridClass = styles?.scrollGrid ?? defaultStyles.scrollGrid ?? "";

  const sectionClasses = [
    "section-grid",
    "section-padding",
    scrollSectionClass,
    sectionClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClasses}>
      <Title sectiontitle={title} />
      <div className={scrollGridClass}>
        {scrolls.map((scroll) => (
          <Fragment key={scroll.titleen}>
            {renderCard ? renderCard(scroll) : scroll}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default HubScrollGridSection;