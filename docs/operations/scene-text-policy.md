# シーンテキスト方針（リライト方針 + AI 構造化）

絵巻シーンの「現代文・解説文」をどう書き、どうデータ化するかの**正本**。
コンセプト: [`../concept/structural-analysis - scroll-viewer v2.md`](../concept/structural-analysis%20-%20scroll-viewer%20v2.md)（「最初の理解コストをどこまで下げられるか」の引き算戦略）。

---

## 1. 目的

- ユーザーが絵巻に関心を持ったときに、シーン単位で**すぐ理解でき、深堀りもできる**状態を作る
- 全巻の解説を人手で書かず、**AI にシーンを読ませてバッチ生成**できるようにデータを構造化する
- 「学術的完全性を入口で要求しない」。入口は短く、深堀りは選択肢として用意する

---

## 2. 現状のギャップ

| 系統 | 現状 | 問題 |
|------|------|------|
| 鳥獣人物戯画 4 巻 | `emaki-text-data/Chōjū-jinbutsu-giga_{first..fourth}.json` は章タイトルのみ | 本文・解説が無く、深堀り UI が動かない |
| 九相図 4 巻 | `chapters-of-kusouzu.json` に desc/descen あり | ekotoba マーカーに `src` が無いためオーバーレイ本文が表示されない |
| 絵師草紙 / 地獄草紙(安住院) | gendaibun のみ | desc/descen が無く解説アコーディオンが空 |
| 英語 | kusouzu 以外 descen 未整備 | ja/en 非対称 |

---

## 3. フィールド契約（各シーンのテキスト）

`emaki-text-data/{titleen}.json`（および YAML の `scenes[].text`）のフィールド。

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `title` / `titleen` | 必須 | 段タイトル（ja / en） |
| `gendaibun` | 詞書がある巻のみ推奨 | **詞書の現代語訳**。詞書（`kobun`）が無い巻では空でよい（解説 `desc` に一本化）。ビューアの「現代文」タブは `kobun` がある段だけ表示 |
| `kobun` | 任意 | 原文（古文。あれば）。あるときのみ「古文」「現代文」タブを出す |
| `desc` / `descen` | 推奨 | 解説文（深堀り層）。背景・絵画表現・文化的文脈を **3〜6 文**。詞書なし巻の主テキスト |
| `descen` | 任意 | 英語解説（`desc` と対で） |

ルール:

- 空文字でも**キーは必ず揃える**（`gendaibun: ""` 等）
- `ja` / `en` は**同時に更新**する（`descen` を含む）
- `<br>` は段落区切りとして使用可（`dangerouslySetInnerHTML` で描画される）

---

## 4. 2 層テキスト原則

理解コストを下げるため、テキストを**2 層**に分ける。

```
層1（詞書ありのみ）: 現代文（gendaibun）+ 古文（kobun）
  詞書の現代語訳／原文。ビューアでは kobun がある段だけタブ表示。
  → 詞書を読みたい段階

層2: 各段の解説（desc / descen）
  デフォルト表示。背景・技法・文化文脈。詞書なし巻はここが主テキスト。
  → 絵巻を「深掘りしたくなった」段階
```

### 層1 の書き方（gendaibun）

- **詞書がある巻のみ**記入（`kobun` と対）。詞書なし巻は空文字でよい
- 一文を短く（読点・改行を活用）
- 漢語・仏教用語は初出で一言補足（例: 「経巻（お経の巻物）」）
- 「詞書が何を述べているか」を具体的に描写する
- 推測は「〜と考えられています」等で明示

### 層2 の書き方（desc / descen）

- 背景（時代・制作事情）、絵画表現（構図・人物・動物の動作）、文化的文脈
- 3〜6 文。出典（ColBase 等）への言及はトップレベルの `sourceImageUrl` / `sourceImage` を参照
- 不確実な事項は「要確認」と明記し、YAML では `# TODO:` コメントで残す

---

## 5. AI 戦略（バッチ生成）

サイト内で全巻の解説を人手で書かない。以下で運用する。

### 5.1 AI 入力パッケージ

1. 巻メタ: `era` / `type` / `keyword` / `sourceImageUrl` / `sourceImage`
2. シーン一覧（読書順）: chapter id・Cloudinary 画像 URL・既存 title / text
   - 鳥獣戯画・九相図: `image-metadata-cache.json` + `emaki-text-data/` から組み立て
   - YAML 管轄巻: `scrolls/{scroll_id}/scroll_config.yaml` の `scenes` から組み立て

### 5.2 生成フロー

```
[1] 汎用 AI  ← プロンプト（docs/operations/ai-scene-text-prompt.md）+ 画像 + 既存テキスト
      ↓ シーンテキスト草案（ja/en）
[2] 人間レビュー（語数・対訳・出典・要確認事項）
      ↓
[3] YAML 管轄巻: scrolls/{scroll_id}/scroll_config.yaml の scenes[].text へ反映
      ↓
[4] scripts/sync_all.py（--dry-run → 本番）で emaki-text-data / image-metadata-cache を生成
```

- 鳥獣戯画・九相図のように YAML を持たない巻は、`emaki-text-data/{titleen}.json` を直接編集する
- 生成後は下記のチェックリストで検証してから反映する

### 5.3 検証チェックリスト

- [ ] 各シーンに `gendaibun` がある（または `# TODO:` で未作成を明記）
- [ ] `ja` / `en` が揃っている（`descen` 含む）
- [ ] 層1 は 1〜3 文、層2 は 3〜6 文
- [ ] 推測は「〜と考えられています」等で明示
- [ ] 出典（ColBase 等）と矛盾していない
- [ ] 漢語・専門語に初出の補足がある

---

## 6. 適用対象（現行 MVP）

| 巻 | 現状 | 対応 |
|----|------|------|
| 鳥獣人物戯画 4 巻 | 章タイトルのみ | `gendaibun` + `desc`/`descen` を全章に追加。`image-metadata-cache.json` に `sceneText: true` を追記 |
| 九相図 4 巻 | desc/descen あり | 方針に照らしてレビュー・補強。オーバーレイ本文表示の修正 |
| 地獄草紙(安住院) / 餓鬼草紙 / 絵師草紙 / 地獄草紙(益田) | gendaibun のみ等 | `scrolls/` YAML の `scenes[].text` を充実 → sync_all.py で再生成 |

`sceneText` フラグの導入と UI ゲートの変更は [データモデル](./data-model.md) とビューア実装（`OverlayEkotoba` / `ChapterTimeline` / `SingleChapterDesc` / `ModalDesc`）に影響するため、`docs/operations/` とコード変更はセットでレビューする。

---

## 7. 運用フローまとめ

```
方針A（リライト）:
  scroll_config.yaml / emaki-text-data JSON を編集
  → ja/en 対訳を確認
  → sync_all.py or 直接編集で反映
  → npm run build で検証

方針B（AI バッチ生成）:
  ai-scene-text-prompt.md のプロンプトで草案生成
  → チェックリスト検証
  → YAML へ反映 → sync_all.py で反映
```

関連ドキュメント:

- コンセプト: [`../concept/structural-analysis - scroll-viewer v2.md`](../concept/structural-analysis%20-%20scroll-viewer%20v2.md)
- データモデル: [`./data-model.md`](./data-model.md)
- パイプライン: [`./scroll-pipeline.md`](./scroll-pipeline.md)
- AI プロンプト: [`./ai-scene-text-prompt.md`](./ai-scene-text-prompt.md)
- スラグ命名: [`./naming-convention.md`](./naming-convention.md)
