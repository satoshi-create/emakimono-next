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
          <a href="/chouju-giga/chapters">鳥獣人物戯画一覧</a>（Chōjū-jinbutsu-giga）
        </li>
        <li>
          🔥 <strong>地獄とダークファンタジー</strong> —
          <a href="/emaki-hub?theme=dark-fantasy">地獄草紙・餓鬼草紙</a>（Hell &amp; Hungry Ghosts Scrolls）
        </li>
        <li>
          💀 <strong>九相と無常</strong> —
          <a href="/kusouzu/chapters-kusouzu">九相図一覧</a>（Kusōzu）
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
        <a href="/chouju-giga/chapters">Chōjū-jinbutsu-giga Gallery</a>
      </li>
      <li>
        🔥 <strong>Hell &amp; Dark Fantasy</strong> —
        <a href="/emaki-hub?theme=dark-fantasy">Hell &amp; Hungry Ghosts Scrolls</a>
      </li>
      <li>
        💀 <strong>Impermanence</strong> —
        <a href="/kusouzu/chapters-kusouzu">Kusōzu Gallery</a>
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

export { en, ja };
