# 🎐 Emakimono：インタラクティブ絵巻物ビューア

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Part of CANW](https://img.shields.io/badge/CANW-ecosystem-blueviolet)](https://github.com/satoshi-create/complexity-and-network-webdesign)
![Contributors](https://img.shields.io/github/contributors/satoshi-create/emakimono-next?color=brightgreen)

📘 他の言語で読む:

- [🇺🇸 English](./README.md)

> **「すべての絵巻物を、インタラクティブに探索可能なものへ。」**

このプロジェクトは、日本の伝統的な絵巻物（絵巻）をインタラクティブなデジタル体験として再構築する試みです。フロントエンド技術、物語表現、文化遺産を結びつけ、オープンで協働的な精神に基づいて開発されています。

[![Emaki Screenshot](./public/assets/hero-img.png)](https://emakimono.com/)

🌟 試してみる：  
👉 [https://emakimono.com/](https://emakimono.com/)

---

## 🧭 貢献ロードマップ

このプロジェクトでは、文化的ストーリーテリングを動的かつアクセスしやすく、ウェブネイティブにしていくというビジョンに共感するコントリビューターを歓迎しています。

以下は、開発フェーズの概要です。  
➡️ 各フェーズの詳細は [📍 Wikiのロードマップ](https://github.com/satoshi-create/emakimono-next/wiki/Contribution-Roadmap) をご覧ください。

### 🗺 ロードマップ概要

```mermaid
journey
  title Emaki Scrolls OSS Roadmap
  section フェーズ1 OSSインフラ刷新
    Next.js 12から最新バージョンへ移行: 4:開発者
    TypeScriptによる型定義の導入: 3:開発者
    Tailwind CSSへの移行: 3:開発者
    コンポーネントとディレクトリ構成の再設計: 3:開発者
  section フェーズ2 データ構造再設計
    JSONからRDB（例：Supabase）へ移行: 4:開発者
    Prisma/Zodによるスキーマ設計: 3:開発者
    画像・テキストメタデータの統合管理: 3:開発者
  section フェーズ3 インタラクティブUXの強化
    サムネイルナビゲーションとスクロール追跡: 4:UXチーム
    現在位置とスクロール方向の視覚化: 4:UXチーム
    GISマップ連携による地理的アクセス: 3:フロント/地理情報チーム
    絵巻間の関係モデル（テーマ・地理・時代）構築: 3:AI/文化チーム
  section フェーズ4 多言語対応と文化ネットワーク連携
    next-i18next によるi18n実装: 3:翻訳チーム
    README/Wiki翻訳とアウトリーチ強化: 3:全員
    GitHub Pagesによる公開サイト整備: 2:全員
    歌枕・神社・連歌ネットワークとの連携: 2:文化研究者
```

---

## 🎨 スクリーンショット

[![Screenshot](./public/assets/demo_kusouzu.gif)](https://emakimono.com/en)

> **体験はこちら：**  
[📜 九相図巻](https://emakimono.com/kusouzumaki)

---

## 🧭 絵巻の操作方法

- 絵巻は伝統通り **左から右へ** とスクロールします。
- スマートフォンでは：指でスワイプ  
  デスクトップでは：トラックパッドや `shift + スクロール` で横移動
- サムネイルやナビゲーションボタンでシーン間をジャンプできます
- 日本語が読めなくても、**直感的に絵の物語を楽しめます！**

📝 [note にてストーリーを紹介中（日本語）](https://note.com/enjoy_emakimono/n/n449f765b4876)

---

## 🧠 関連プロジェクト

- [📜 Horizontal Scroll Emaki（CANWプロジェクト内）](https://github.com/satoshi-create/complexity-and-network-webdesign/tree/main/projects/horizontal-scroll-emaki)
- [🌐 CANW GitHubリポジトリ](https://github.com/satoshi-create/complexity-and-network-webdesign)

---

## 💬 参加する

このプロジェクトはオープンソースで、CANWという広範なエコシステムの一部です。

- [Issues](../../issues) から提案や改善を投稿
- [CANW Discussions](https://github.com/satoshi-create/complexity-and-network-webdesign/discussions) に参加
- [プロジェクト提案カテゴリー](https://github.com/satoshi-create/complexity-and-network-webdesign/discussions/categories/-proposals) にアイデアを投稿

---

## 📚 ドキュメント

詳細な仕様やコントリビューションガイドは、[Emaki Project Wiki](https://github.com/satoshi-create/emakimono-next/wiki) をご覧ください。

---

## 🌟 貢献者

Emakimonoプロジェクトに関わってくださるすべての皆さまに感謝します 🌱

<a href="https://github.com/satoshi-create/emakimono-next/contributors">
  <img src="https://contrib.rocks/image?repo=satoshi-create/emakimono-next" />
</a>

---

## 📘 ライセンス

MITライセンス  
(C) 2024 satoshi-create
