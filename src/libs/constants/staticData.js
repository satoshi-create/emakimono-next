const ja = {
  top: {
    title: "絵巻物を横スクロールで鑑賞",
    titleen: "View Emaki with Horizontal Scrolling",
    desc: "絵巻物（えまきもの）は、本来「読むもの」ではなく「繰り展げて追うもの」。平安〜鎌倉時代に描かれた鳥獣人物戯画や九相図などの名作絵巻を、横スクロールで全シーンにわたって鑑賞できます。",
  },
  cyouzyuu: {
    title: "鳥獣人物戯画とは — 日本最古のマンガを全4巻横スクロール",
    titleen: "What is Chōjū-jinbutsu-giga? Japan's Oldest Manga",
    desc: "鳥獣人物戯画（ちょうじゅうじんぶつぎが）は、平安〜鎌倉時代に描かれた戯画絵巻。兎や猿、蛙などが人間のように振る舞う滑稽な描写で知られ、「日本最古のマンガ」とも称されます。誰が描いたのかは不明な部分が多く、謎に包まれています。甲巻から丁巻までの全4巻を、横スクロールで一気に観賞してみましょう。",
    name: "cyouzyuu",
    columns: "four",
  },
  kusouzu: {
    title: "九相図とは — 全九相を横スクロールで観想",
    titleen: "What is Kusōzu? Contemplate All Nine Stages",
    desc: "九相図は、美しい女性が死後朽ち果てるまでを9つの段階で描いた仏教絵巻。鎌倉時代に制作され、肉体の美醜を生々しく表現し、修行者の無常観を促す目的を持ちました。本作は檀林皇后をモデルとした九相図の代表作で、全シーンを横スクロールでご覧いただけます。",
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
      <p>このプロジェクトでは、まずアクセスの多かった2つの絵巻を収録しています：</p>
       <br/>
      <ul>
        <li>
        🐸 <strong>鳥獣人物戯画絵巻</strong>（Chōjū-jinbutsu-giga）
        </li>
        <li>💀 <strong>九相図巻</strong>（Kusōzu – Nine Stages of a Decaying Corpse）</li>
      </ul>
       <br/>
      <p>
        これらは、教科書で断片的に紹介されることはあっても、
        全体を連続的に見ることはなかなかできません。
        本サイトでは、横スクロールを使って一気に絵巻物を展開し、
        あたかもアニメを観るように物語を追いかけることができます。
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
        過去のバージョンでは多くの絵巻を扱っていましたが、
        現在は「鳥獣人物戯画」と「九相図巻」に焦点を絞り、コードをシンプルに保っています。
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
    desc: "Emaki (picture scrolls) are meant to be slowly unrolled and followed — not read like a book. Enjoy masterpieces such as Chōjū-jinbutsu-giga and Kusōzu from the Heian–Kamakura periods, scene by scene, with horizontal scrolling.",
  },
  kusouzu: {
    title: "What is Kusōzu? — Nine Stages of Decay",
    titleen: "九相図とは — 全九相を横スクロールで観想",
    desc: "Kusōzu (Nine Stages of Decay) is a Buddhist picture scroll depicting a beautiful woman's body decaying through nine stages after death, created in the Kamakura period. It vividly portrays the beauty and ugliness of the human body to inspire meditation on impermanence. Based on Empress Danrin, it is one of the most celebrated kusōzu scrolls. Scroll horizontally through every scene.",
    name: "kusouzu",
    columns: "four",
  },
  cyouzyuu: {
    title: "What is Chōjū-jinbutsu-giga? See Japan's Oldest Manga in Horizontal Scrolling",
    titleen: "鳥獣人物戯画とは — 日本最古のマンガを全4巻横スクロール",
    desc: "Chōjū-jinbutsu-giga (Frolicking Animals and Humans) is a set of picture scrolls from the Heian–Kamakura period. Famous for humorous depictions of rabbits, monkeys, and frogs behaving like humans, it is often called Japan's oldest manga. The artist remains unknown, and the scrolls are full of mystery. Browse all four scrolls (A–D) horizontally.",
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
      This project currently focuses on two of the most accessed emaki scrolls:
    </p>
    <br/>
    <ul>
      <li>
        🐸 <strong>Chōjū-jinbutsu-giga</strong> (Scrolls of Frolicking Animals and People)
      </li>
      <li>
        💀 <strong>Kusōzu</strong> – Nine Stages of a Decaying Corpse
      </li>
    </ul>
    <br/>
    <p>
      These works are often introduced only in fragments in school textbooks and museums.
      Here, you can experience them in full via smooth horizontal scrolling—
      following the story as if you were watching a piece of animation.
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
      The previous version included many emaki scrolls, but we have now narrowed our focus to
      <strong>Chōjū-jinbutsu-giga</strong> and <strong>Kusōzu</strong> in order to keep the codebase clean and simple.
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
