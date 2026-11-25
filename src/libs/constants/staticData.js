const ja = {
  top: {
    title: "絵巻物を横スクロールで鑑賞",
    titleen: "View Emaki with Horizontal Scrolling",
    desc: "絵巻物（えまきもの）は、本来「読むもの」ではなく「繰り展げて追うもの」。風刺・地獄・無常——平安〜鎌倉時代の絵巻を、横スクロールで全シーンにわたって追いかけられます。",
  },
  cyouzyuu: {
    title: "鳥獣人物戯画",
    titleen: "Chōjū-jinbutsu-giga",
    desc: "日本最古のマンガとも称される戯画絵巻。甲〜丁の全4巻を横スクロールで鑑賞できます。",
    name: "cyouzyuu",
    columns: "four",
  },
  kusouzu: {
    title: "九相図",
    titleen: "Kusōzu",
    desc: "生前相から灰相まで十相を追う仏教絵巻。関連する九相図絵巻も横スクロールで観想できます。",
    name: "kusouzu",
    columns: "four",
  },
  about: {
    sectiontitle: "このプロジェクトについて",
    intro: `
    <p>
        絵巻物とは、本来「読むもの」ではなく「繰り展げて追うもの」です。
        左へ左へと少しずつ巻きをほどき、現れては消えていく絵を追いながら、
        物語の世界に没入していく──。その体験は、絵を静かに鑑賞するというよりも、
        アニメーションを味わう感覚に近いかもしれません。
      </p>
      <br/>
      <p>
        しかし、現実の絵巻物を手に取る機会は非常に限られており、
        書籍や図録では断片的にしか掲載されていません。
        デジタル上でも、縦スクロールや静止画の一覧表示が一般的で、
        「繰り展げる」本来の鑑賞方法を体験できる機会はほとんどありません。
      </p>
            <br/>
      <p>
        そこで私たちは、<strong>ウェブの横スクロールという表現手法を活かし、
        「絵巻物を繰り展げながら鑑賞する」インターフェースを再現する</strong>
        ことに挑戦しました。
      </p>
       <br/>
      <p>
        本サイトでは、平安〜鎌倉時代の絵巻をテーマ別に横スクロールで鑑賞できます。
        鳥獣人物戯画・地獄草紙・餓鬼草紙・九相図など、
        教科書では断片的にしか触れられない作品を、連続したシーンとして追えます。
      </p>
       <br/>
      <ul>
        <li>
          🐸 <strong>風刺とユーモア</strong> —
          <a href="/hub/chouju-giga">鳥獣人物戯画一覧</a>（Chōjū-jinbutsu-giga）
        </li>
        <li>
          🔥 <strong>地獄とダークファンタジー</strong> —
          <a href="/emaki-hub?theme=dark-fantasy">地獄草紙・餓鬼草紙</a>（Hell &amp; Hungry Ghosts Scrolls）
        </li>
        <li>
          💀 <strong>九相と無常</strong> —
          <a href="/hub/kusouzu">九相図一覧</a>（Kusōzu）
        </li>
        <li>
          📺 <strong>マンガ・アニメのルーツ</strong> —
          <a href="/manga-roots">現代作品とのつながり</a>
        </li>
      </ul>
       <br/>
      <p>
        本サイトでは、横スクロールを使って一気に絵巻物を展開し、
        あたかもアニメを観るように物語を追いかけることができます。
        コレクションは段階的に拡大中です。
      </p>
      <br/><br/>
  `,
    contributor: `
    <p>
        本プロジェクトは現在、<strong>オープンソース化（OSS）に向けてリファクタリング中</strong>です。
        最小限の構成から出発し、将来的には以下のような改善を目指しています：
      </p>
        <br/>
      <ul>
        <li>- TypeScript化とNext.jsのバージョンアップ</li>
        <li>- 絵巻のデータ構造の整備（JSON, Supabase 等）</li>
        <li>- サムネイル付きのナビゲーションや閲覧インジケーターの追加</li>
        <li>- 新しい絵巻の追加や、テーマ別コレクションの展開</li>
      </ul>
        <br/>
      <p>
        MVP として鳥獣人物戯画と九相図から始め、
        現在は地獄草紙・餓鬼草紙などへの拡張と、テーマ別ハブページの整備を進めています。
      </p>
        <br/>
      <p>
        <strong>「絵巻物 × フロントエンド」</strong>というユニークなテーマに興味がある方、
        ぜひ一緒にこのプロジェクトを育てていきませんか？
      </p>
      <p>
  👉 このプロジェクトのソースコードは、
  <a href="https://github.com/satoshi-create/emakimono-next" target="_blank" rel="noopener noreferrer">
    GitHub リポジトリ
  </a>
  から閲覧・参加できます。
</p>

  `,
  },
};

const en = {
  top: {
    title: "View Emaki with Horizontal Scrolling",
    titleen: "絵巻物を横スクロールで鑑賞",
    desc: "Emaki are meant to be unrolled and followed — not read like a book. From satire and hell scrolls to kusōzu, explore Heian–Kamakura picture scrolls scene by scene with horizontal scrolling.",
  },
  kusouzu: {
    title: "Kusōzu",
    titleen: "九相図",
    desc: "Buddhist scrolls depicting all ten stages from life to ash. Contemplate related kusōzu works with horizontal scrolling.",
    name: "kusouzu",
    columns: "four",
  },
  cyouzyuu: {
    title: "Chōjū-jinbutsu-giga",
    titleen: "鳥獣人物戯画",
    desc: "Often called Japan's oldest manga. Browse all four scrolls (A–D) horizontally.",
    name: "cyouzyuu",
    columns: "four",
  },
  about: {
    sectiontitle: "About This Project",
    intro: `
    <p>
      Emaki picture scrolls are not meant to be "read" in the conventional sense—they are meant to be slowly unrolled and followed visually.
      As the scroll is extended leftward, images appear and disappear, drawing the viewer into the story's world.
      This experience feels less like appreciating static art, and more like savoring an animation.
    </p>
    <br/>
    <p>
      Unfortunately, opportunities to view authentic emaki are rare. In books and catalogs, they are often presented only in fragments.
      Even in digital formats, vertical scrolling or static image lists are common, making it difficult to experience the original horizontal "unrolling" format.
    </p>
    <br/>
    <p>
      That’s why we set out to <strong>recreate the experience of scrolling through emaki using the expressive power of horizontal scrolling on the web</strong>.
    </p>
    <br/>
    <p>
      This site lets you explore Heian–Kamakura emaki by theme with horizontal scrolling.
      Works such as Chōjū-jinbutsu-giga, Hell Scrolls, Hungry Ghosts Scrolls, and Kusōzu
      are rarely shown in full outside museums — here you can follow every scene in sequence.
    </p>
    <br/>
    <ul>
      <li>
        🐸 <strong>Satire &amp; Humor</strong> —
        <a href="/hub/chouju-giga">Chōjū-jinbutsu-giga Gallery</a>
      </li>
      <li>
        🔥 <strong>Hell &amp; Dark Fantasy</strong> —
        <a href="/emaki-hub?theme=dark-fantasy">Hell &amp; Hungry Ghosts Scrolls</a>
      </li>
      <li>
        💀 <strong>Impermanence</strong> —
        <a href="/hub/kusouzu">Kusōzu Gallery</a>
      </li>
      <li>
        📺 <strong>Manga &amp; Anime Roots</strong> —
        <a href="/manga-roots">Connections to modern works</a>
      </li>
    </ul>
    <br/>
    <p>
      Scroll horizontally through each work as if watching animation.
      The collection is expanding over time.
    </p>
    <br/><br/>
  `,
    contributor: `
    <p>
      This project is currently <strong>undergoing refactoring in preparation for open-source (OSS) release</strong>.
      Starting from a minimal structure, we aim to improve the following areas over time:
    </p>
    <br/>
    <ul>
      <li>- Migration to TypeScript and updating to a newer version of Next.js</li>
      <li>- Structuring emaki data (using JSON, Supabase, etc.)</li>
      <li>- Adding thumbnail navigation and scroll indicators</li>
      <li>- Expanding the collection with new emaki and thematic categories</li>
    </ul>
    <br/>
    <p>
      We started with Chōjū-jinbutsu-giga and Kusōzu as our MVP, and are now expanding
      to Hell Scrolls, Hungry Ghosts Scrolls, and thematic hub pages.
    </p>
    <br/>
    <p>
      If you're intrigued by the unique theme of <strong>“Emaki × Front-End”</strong>,
      we invite you to join us in growing this project together!
    </p>
    <p>
      👉 You can explore the source code and contribute via our
         <a href="https://github.com/satoshi-create/emakimono-next" target="_blank" rel="noopener noreferrer">
        GitHub repository
      </a>.
    </p>
  `,
  },
};

const zhHans = {
  ...en,
  top: {
    title: "横向滚动欣赏古代绘卷艺术",
    titleen: "View Emaki with Horizontal Scrolling",
    desc: "绘卷物并非单纯“阅读”的书籍，而是亲手徐徐展开、追随画面流转的视觉艺术。讽刺、地狱、无常——通过横向滚动完整体验平安至镰仓时代的经典画卷。",
  },
  about: {
    sectiontitle: "关于本项目",
    intro: `
      <p>
        绘卷物原本不是“阅读”的书本，而是亲手一点点向左展开、在画面出现与消逝之间沉浸于故事世界的动态艺术——这种体验与其说是静态赏画，不如说更接近于观看一部古典动画。
      </p>
      <br/>
      <p>
        然而，现实中亲手展开绘卷的机会极为有限，书籍与画册也往往只能截取片段。即使在数字平台上，纵向滚动或静态图集仍是主流，几乎无法还原“徐徐展开长卷”的原始鉴赏体验。
      </p>
      <br/>
      <p>
        因此，我们尝试<strong>利用网页的横向滚动交互，在线重现“边展开边欣赏绘卷”的沉浸式界面</strong>。
      </p>
      <br/>
      <p>
        在本站，您可以按主题横向滚动欣赏《鸟兽人物戏画》《地狱草纸》《饿鬼草纸》《九相图》等经典名作，将以往只能零散看到的画面作为连续完整的故事长卷来体验。
      </p>
    `,
    contributor: en.about.contributor,
  },
};

const zhHant = {
  ...en,
  top: {
    title: "橫向滾動欣賞古代繪卷藝術",
    titleen: "View Emaki with Horizontal Scrolling",
    desc: "繪卷物並非單純「閱讀」的書籍，而是親手徐徐展開、追隨畫面流轉的視覺藝術。諷刺、地獄、無常——透過橫向滾動完整體驗平安至鎌倉時代的經典畫卷。",
  },
  about: {
    sectiontitle: "關於本專案",
    intro: `
      <p>
        繪卷物原本不是「閱讀」的書本，而是親手一點點向左展開、在畫面出現與消逝之間沉浸於故事世界的動態藝術——這種體驗與其說是靜態賞畫，不如說更接近於觀看一部古典動畫。
      </p>
      <br/>
      <p>
        然而，現實中親手展開繪卷的機會極為有限，書籍與畫冊也往往只能截取片段。即使在數位平台上，縱向滾動或靜態圖集仍是主流，幾乎無法還原「徐徐展開長卷」的原始鑑賞體驗。
      </p>
      <br/>
      <p>
        因此，我們嘗試<strong>利用網頁的橫向滾動互動，線上重現「邊展開邊欣賞繪卷」的沉浸式介面</strong>。
      </p>
      <br/>
      <p>
        在本站，您可以依主題橫向滾動欣賞《鳥獸人物戲畫》《地獄草紙》《餓鬼草紙》《九相圖》等經典名作，將以往只能零散看到的畫面作為連續完整的故事長卷來體驗。
      </p>
    `,
    contributor: en.about.contributor,
  },
};

export { en, ja, zhHans, zhHant };
