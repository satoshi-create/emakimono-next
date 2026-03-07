# public フォルダ整理 変更案

## 1. 現状の課題

- `public` 直下に favicon、OGP、サムネイル、SVG、GIF などがフラットに並び、エクスプローラーで見づらい
- ファイル種別ごとの分類がなく、管理・保守がしづらい

---

## 2. 提案するディレクトリ構成

```
public/
├── favicon/                    # ファビコン・PWA アイコン
│   ├── favicon.ico
│   ├── favicon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   └── android-chrome-512x512.png
│
├── ogp/                        # OGP 画像
│   ├── ogp.jpg
│   └── ogp.png
│
├── icons/                      # UI 用アイコン（SVG・PNG）
│   ├── scroll-solid.svg
│   ├── question-solid.svg
│   ├── note-icon.svg
│   ├── note-icon.png
│   └── x.svg                   # svg/x.svg から移動
│
├── thumbnails/                 # 作品サムネイル
│   ├── cyoujyuu_yamazaki_kou_thumb.webp
│   ├── cyoujyuu_yamazaki_otu_thumb.webp
│   ├── cyoujyuu_yamazaki_hei_thumb.webp
│   ├── cyoujyuu_yamazaki_tei_thumb.webp
│   ├── kusouzumaki_thumb.webp
│   ├── kusouzu_eitaku_thumb.webp
│   ├── kusoushiemaki_thumb.webp
│   ├── nine-stages-of-decay-empress-danrin_honolulu_thumb.webp
│   └── jigokusoushi_anzyuin_thumb.webp
│
├── assets/                     # 汎用アセット（背景・デモ・ヒーロー画像など）
│   ├── 110310200304.webp       # 背景画像（存在する場合）
│   ├── washi-pattern-01.webp   # 和紙パターン（存在する場合）
│   ├── demo_kusouzu.gif
│   ├── hero-img.png
│   ├── hero-img_new.png
│   └── portrait_tachibananokachiko.webp
│
├── images/                     # 既存のまま（作品ごとの画像）
│   ├── jigokusoushi-anzyuin/
│   ├── kuso-zu-emaki/
│   ├── kusoushi-emaki/
│   ├── kusouzu-eitaku/
│   └── kusouzu-honolulu/
│
├── locales/                    # 既存のまま
│   ├── ja/
│   └── en/
│
├── manifest.json               # ルート維持（PWA の scope のため）
├── robots.txt
├── sitemap.xml
├── sitemap-0.xml
├── sw.js
└── workbox-*.js
```

---

## 3. パス変更マッピング

| 旧パス | 新パス |
|--------|--------|
| `/favicon.ico` | `/favicon/favicon.ico` |
| `/favicon.png` | `/favicon/favicon.png` |
| `/favicon-16x16.png` | `/favicon/favicon-16x16.png` |
| `/favicon-32x32.png` | `/favicon/favicon-32x32.png` |
| `/apple-touch-icon.png` | `/favicon/apple-touch-icon.png` |
| `/android-chrome-192x192.png` | `/favicon/android-chrome-192x192.png` |
| `/android-chrome-512x512.png` | `/favicon/android-chrome-512x512.png` |
| `/ogp.jpg` | `/ogp/ogp.jpg` |
| `/ogp.png` | `/ogp/ogp.png` |
| `/scroll-solid.svg` | `/icons/scroll-solid.svg` |
| `/question-solid.svg` | `/icons/question-solid.svg` |
| `/note-icon.svg` | `/icons/note-icon.svg` |
| `/note-icon.png` | `/icons/note-icon.png` |
| `/svg/x.svg` | `/icons/x.svg` |
| `/*_thumb.webp` | `/thumbnails/*_thumb.webp` |
| `/110310200304.webp` | `/assets/110310200304.webp` |
| `/washi-pattern-01.webp` | `/assets/washi-pattern-01.webp` |
| `/demo_kusouzu.gif` | `/assets/demo_kusouzu.gif` |
| `/portrait_tachibananokachiko.webp` | `/assets/portrait_tachibananokachiko.webp` |

※ `hero-img.png`, `hero-img_new.png` は参照元を確認してから移動

---

## 4. 更新が必要なファイル一覧

### 4.1 ファビコン・PWA

| ファイル | 変更内容 |
|----------|----------|
| `src/pages/_document.js` | favicon 系リンクを `/favicon/xxx` に変更 |
| `public/manifest.json` | `icons[].src` を `/favicon/android-chrome-*.png` に変更 |
| `src/components/layout/Header.js` | `/favicon.ico` → `/favicon/favicon.ico` |
| `src/components/emaki/layout/EmakiHeader.js` | 同上 |
| `src/components/layout/Footer.js` | `/favicon-32x32.png` → `/favicon/favicon-32x32.png` |
| `src/pages/[slug].js` | `url: "/favicon.png"` → `/favicon/favicon.png` |
| `src/libs/constants/dataSiteMeta.js` | `siteIcon: "/favicon.png"` → `/favicon/favicon.png` |

### 4.2 OGP

| ファイル | 変更内容 |
|----------|----------|
| `src/components/meta/Meta.js` | `/ogp.png` → `/ogp/ogp.png` |

### 4.3 アイコン（SVG・PNG）

| ファイル | 変更内容 |
|----------|----------|
| `src/components/emaki/layout/EmakiLandscapContent.js` | `/question-solid.svg` → `/icons/question-solid.svg` |
| `src/components/emaki/layout/EmakiPortraitContent.js` | 同上 |
| `src/libs/constants/socialLinks.js` | `import` パスを `../../../public/icons/note-icon.png` に、または `src="/icons/note-icon.png"` に変更 |
| `src/libs/constants/socialLinks.js` | `/svg/x.svg` → `/icons/x.svg` |

### 4.4 サムネイル・背景画像

| ファイル | 変更内容 |
|----------|----------|
| `src/data/image-metadata-cache/image-metadata-cache.json` | `thumb`, `thumb2`, `backgroundImage`, `portrait` のパスを一括置換 |
| `src/data/gallary/index.json` | `thumbnail` を `/thumbnails/xxx` に変更 |
| `src/zukan/3_scrolls/scrolls.json` | `thumbnail: "images/xxx"` → `thumbnail: "thumbnails/xxx"`（現状 `images/` プレフィックスなので要確認） |
| `src/zukan/3_scrolls/scrolls.csv` | 同上 |
| `src/data/json-data/dataUkiyoes.json` | 各種画像パスを `/assets/` または適切なサブディレクトリに |
| `src/data/json-data/dataSuibokuga.json` | 同上 |
| `src/styles/OverlayEkotoba.module.css` | （コメントアウト中）`/washi-pattern-01.webp` → `/assets/washi-pattern-01.webp` |
| `src/styles/EmakiConteiner.module.css` | 同上 |

### 4.5 アーカイブ（更新不要だが参考）

- `src/libs/_archive_unused_data/image-metadata-cache-old.json`
- `src/libs/_archive_unused_data/dummydata.js`

---

## 5. 実装手順（推奨）

1. **バックアップ**  
   `public` フォルダをコピーしておく。

2. **ディレクトリ作成**  
   `favicon/`, `ogp/`, `icons/`, `thumbnails/`, `assets/` を作成。

3. **ファイル移動**  
   上記マッピングに従い、ファイルを移動。

4. **参照の一括置換**  
   - 正規表現で一括置換するスクリプトを用意するか、  
   - 各ファイルを手動で更新。

5. **動作確認**  
   - `npm run dev` でローカル起動  
   - ファビコン、OGP、サムネイル、絵巻ビューアの表示を確認  
   - ビルド `npm run build` が通ることを確認。

---

## 5.1 実装済み（2025年3月）

- **フェーズ1**: favicon/, ogp/, icons/ 完了
- **フェーズ2**: thumbnails/ 完了
- **フェーズ3**: assets/ 完了（demo_kusouzu.gif, hero-img*.png, portrait_tachibananokachiko.webp を移動）

**未対応**: `110310200304.webp`, `washi-pattern-01.webp` は public に存在しないため、参照パスは現状維持。これらを追加する場合は `assets/` に配置し、JSON の `backgroundImage` を `/assets/xxx` に更新すること。

---

## 6. 注意点・リスク

- **Next.js の public 配信**  
  `public` 内のファイルはルート相対（`/xxx`）で配信されるため、パス変更時は参照を漏れなく更新する必要がある。

- **外部リンク・キャッシュ**  
  既に SNS 等でシェアされた OGP の URL が変わる場合、一部キャッシュが残る可能性がある。OGP はルート維持（`/ogp.png`）も検討可能。

- **scrolls.json / scrolls.csv の thumbnail**  
  現状 `images/cyoujyuu_yamazaki_kou_thumb.webp` のように `images/` プレフィックスになっており、実際のファイルは `public` 直下にある。この不整合の解消も整理時に合わせて行うとよい。

- **sync_scroll.py 等のスクリプト**  
  `SCROLL_IMAGES_DIR` が `public/images` を指している場合は、`images/` は維持するため影響なし。

---

## 7. 代替案：最小限の整理

変更範囲を抑えたい場合は、次のように **サムネイルのみ** を `thumbnails/` にまとめる案もある。

- `public/thumbnails/` を作成し、`*_thumb.webp` のみ移動
- `image-metadata-cache.json`, `gallary/index.json`, `scrolls.json`, `scrolls.csv` のパスのみ更新
- favicon・OGP・icons は現状維持

この場合、更新ファイル数は少なく済むが、エクスプローラー上の整理効果は限定的。

---

## 8. まとめ

| 項目 | 内容 |
|------|------|
| 目的 | public 直下のフラットな構成を、種別ごとのサブディレクトリに整理 |
| 対象 | favicon, ogp, icons, thumbnails, assets |
| 更新ファイル数 | 約 15〜20 ファイル（JSON の置換含む） |
| リスク | パス漏れによる 404、既存 OGP キャッシュ |
| 推奨 | 段階的に実施（例：まず thumbnails のみ → その後 favicon/ogp/icons） |
