const ja = {
  cyouzyuu: {
    title: "鳥獣人物戯画絵巻全巻イッキ見！！",
    titleen: "See all cyoujyu-jinbutsu-giga（Frog and rabbit）",
    desc: "「鳥獣人物戯画絵巻」の甲巻から丁巻までを、横スクロールで一度に楽しむことができます。この絵巻は、平安時代から鎌倉時代にかけて描かれ、動物や人間が遊戯に興じる様子が、洒脱な筆致で表現されています。誰が描いたのかは不明な部分が多く、謎に包まれた絵巻です。全巻一気に観賞し、絵巻の謎に挑戦してみましょう。",
    name: "cyouzyuu",
    columns: "four",
  },
  kusouzu: {
    title: "九相図観想",
    titleen: "contemplation of Nine stages of decay",
    desc: "「九相図」の全図を描いた絵巻物を、横スクロールでご覧いただけます。美しい女性が死後、朽ち果てるまでの変容を9つの段階に分け、肉体の美しさと醜さが生々しく描かれています。全九相を一度に鑑賞し、仏教の修行者になった気分で浄土を観想してみましょう！",
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
  kusouzu: {
    title: "contemplation of Nine stages of decay",
    titleen: "九相図観想",
    desc: "All scenes of the nine phases of the scroll can be enjoyed by scrolling horizontally. The transformation of a beautiful woman from death to decay is divided into nine phases, vividly depicting the beauty and ugliness of the body. View all nine phases together and contemplate the Pure Land as if you were a Buddhist practitioner!",
    name: "kusouzu",
    columns: "four",
  },
  cyouzyuu: {
    title: "See all Chōjū-jinbutsu-giga",
    titleen: "鳥獣人物戯画絵巻イッキ見！！",
    desc: "You can enjoy all scrolls of the Birds, Beasts, and Humans Caricature Picture Scrolls from A to Ding scrolls in side-scrolling mode. These picture scrolls were painted between the Heian and Kamakura periods, and depict animals and humans playing games with a stylish touch. There are many mysteries in these picture scrolls, and it is not always known who painted them. Let's take a look at all the scrolls and try to solve the riddles.",
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
