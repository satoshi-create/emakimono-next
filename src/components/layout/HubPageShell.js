import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import styles from "@/styles/HubPageShell.module.css";

/**
 * ハブ系ページ共通シェル。
 *
 * ページ全体の骨格を「ヒーロー → セクションナビ → セクション群 → フッター」に統一する。
 * 九相図ハブ・鳥獣戯画ハブ・人物紹介ページなど、コンテンツ毎にヒーローとセクションを
 * props で注入して使う。
 *
 * props:
 * - meta:         Head（Meta.js）へ渡すオブジェクト（pagetitle, pageDesc, jsonLd 等）
 * - headerSlug:   Header の NavLinks 用スラグ（任意）
 * - breadcrumb:   Breadcrumbs へ渡すオブジェクト（name, test, testen）
 * - hero:         ヒーロー部の JSX（画像ヒーロー / プロフィール紹介など）
 * - navItems:     セクションナビ項目 [{ id, label }]。空なら非表示
 * - sections:     メイン部のセクション [{ id, content }]。各 id にアンカー
 */
const HubPageShell = ({
  meta,
  headerSlug,
  breadcrumb,
  hero,
  navItems = [],
  sections = [],
}) => {
  return (
    <main>
      <Head {...meta} />
      <Header slug={headerSlug} />
      <Breadcrumbs {...breadcrumb} />
      {hero}
      {navItems.length > 0 && (
        <nav className={styles.sectionNav}>
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
      )}
      {sections.map((section) => (
        <div key={section.id} id={section.id} className={styles.sectionAnchor}>
          {section.content}
        </div>
      ))}
      <Footer />
    </main>
  );
};

export default HubPageShell;
