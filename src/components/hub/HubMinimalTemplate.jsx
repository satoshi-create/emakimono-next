import HubPageShell from "@/components/layout/HubPageShell";
import { HubHeroWithBoards } from "@/components/hub/HubHeroWithBoards";
import CardA from "@/components/ui/CardA";

/**
 * @param {object} props
 * @param {object} props.meta
 * @param {string} props.headerSlug
 * @param {import("react").ReactNode} props.breadcrumb
 * @param {import("@/components/hub/HubHeroWithBoards").HubHeroWithBoardsProps} props.heroProps
 * @param {object} props.worksSection
 * @param {string} [props.worksSection.id]
 * @param {Array} props.worksSection.emakis
 * @param {string} props.worksSection.sectiontitle
 * @param {string} [props.worksSection.sectiontitleen]
 * @param {string} [props.worksSection.columns]
 * @param {boolean} [props.worksSection.needdesc]
 * @param {Array<{ id: string, label: string }>} [props.navItems]
 * @param {Array<{ id: string, content: import("react").ReactNode }>} [props.extraSections]
 * @param {"after" | "custom"} [props.extraSectionsPosition]
 * @param {Array<{ id: string, content: import("react").ReactNode }>} [props.allSections]
 */
export default function HubMinimalTemplate({
  meta,
  headerSlug,
  breadcrumb,
  heroProps,
  worksSection,
  navItems,
  extraSections,
  extraSectionsPosition = "after",
  allSections,
}) {
  const hero = <HubHeroWithBoards {...heroProps} />;

  const defaultWorksSection = {
    id: worksSection?.id ?? "scrolls",
    content: (
      <CardA
        emakis={worksSection?.emakis ?? []}
        columns={worksSection?.columns ?? "three"}
        sectiontitle={worksSection?.sectiontitle}
        sectiontitleen={worksSection?.sectiontitleen}
        needdesc={Boolean(worksSection?.needdesc)}
      />
    ),
  };

  const sections =
    allSections ??
    (extraSectionsPosition === "after"
      ? [defaultWorksSection, ...(extraSections ?? [])]
      : [defaultWorksSection]);

  return (
    <HubPageShell
      meta={meta}
      headerSlug={headerSlug}
      breadcrumb={breadcrumb}
      hero={hero}
      navItems={navItems}
      sections={sections}
    />
  );
}