# Cursor Agent 用プロンプト — 絵巻ディスカバリ改善

調査（2026-09 Analytics）に基づく内部リンク・ハブ・ホーム導線の実装指示。

実装ブランチ例: `feat/discovery-hubs-internal-links`

詳細なタスク本文はチャット履歴「実装方法のプロンプト」を参照。要約:

| Pillar | 内容 | 主なパス |
|--------|------|----------|
| A | `/type/emaki`・`/ranking` に注目ブロック | `DiscoverySpotlight` / `discoveryLinks.js` |
| B | `/hyakki/chapters` ハブ＋ナビ＋ビューア戻り | `pages/hyakki/chapters.js` / `HyakkiHubLink` |
| C | `HOME_LATEST_SCROLLS` を最大5枠 | `links.js` |

**やらないこと:** sitemap priority のみ、全絵巻均等 SEO、ビューア scroll 核心改修。

**Backlog:** 六道専用ハブ、源氏ハブ強化、Cloudinary ウォーム。
