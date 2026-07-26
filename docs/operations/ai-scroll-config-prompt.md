# 汎用 AI 用プロンプト — scroll_config.yaml 作成

絵巻の画像と見出し（段タイトル）の対応を検討し、`scroll_config.yaml` を生成するためのプロンプト集です。  
ChatGPT・Claude・Gemini など、画像入力に対応した AI にそのまま貼り付けて使えます。

## このプロンプトの位置づけ

```
[1] 汎用 AI  ← 本ドキュメント（画像分析 + YAML 草案）
      ↓
[2] scrolls/{scroll_id}/ に配置（YAML + images/）
      ↓
[3] preflight_scroll.py
      ↓
[4] check_cloudinary_usage.py（本番 sync 前）
      ↓
[5] sync_all.py --dry-run → 本番 sync
      ↓
[6] PR → validate-scroll.yml（preflight + dry-run、自動）
```

**手順・CI・運用の正本:** [`scroll-pipeline.md`](./scroll-pipeline.md)  
命名規則: [`naming-convention.md`](./naming-convention.md)

---

## 事前準備（AI に渡す前）

1. **絵巻画像**を左から右（巻の進行方向）の順に並べる
2. ファイル名に連番を付ける（推奨）
  例: `_01-1080.jpg`, `_02-1080.jpg`, …  
   ※ アップロード時にこの番号が `range` の global index と対応します
3. 以下が分かると精度が上がります:
  - 作品名・所蔵・巻数
  - 参考文献や解説サイトの URL
  - 段（シーン）の区切りが分かる資料（解説本、ColBase など）
4. **詞書（kotobagaki）** がある場合
  - `metadata.kotobagaki: true` とし、各 scene に `text` ブロック（現代語訳など）を YAML に含める  
  - **地獄草紙型**（词書・絵画が交互）: `kotobagaki_mode: "alternating"` — range は [1,2], [3,4], … の2枚1組  
  - **餓鬼草紙型**（词書画像なし・絵のみ）: `kotobagaki_mode` は省略 — 各 scene に空 ekotoba + 絵1枚  
  - **絵師草紙型**（任意配置・词書連続あり）: `kotobagaki_mode: "explicit"` + 各 scene に `slots: [image, ekotoba, …]`（range 内 index 順）。完成例: `scrolls/eshi-no-soshi/`  
  - `sync_all.py` が `scenes[].text` から `src/data/emaki-text-data/{titleen}.json` を自動生成

---



## プロンプト A — 段構成の分析（第1段階）

画像をすべて添付したうえで、以下をコピーして使います。  
`{{...}}` 部分を実際の値に置き換えてください。

```markdown
あなたは日本の絵巻物（emaki）のデジタルアーカイブ担当です。
添付した画像は「{{作品名}}」（{{所蔵・版}}）の絵巻を、左から右の順に並べたものです。

## タスク
1. 各画像を左から順に番号付け（global index: 1, 2, 3, …）
2. 絵巻の「段」（ narrative scene / シーン）にグループ分け
3. 各段に適切な日本語タイトルと英語タイトル（titleen）を提案
4. 結果を表形式で出力（YAML はまだ書かない）

## 出力形式（表）

| global index | ファイル名（推定） | 段 id | 段タイトル（日本語） | 段タイトル（英語） | 内容メモ |
|---|---|---|---|---|---|
| 1 | _01-1080.jpg | 1 | … | … | … |
| 2 | _02-1080.jpg | 1 | … | … | 同一段の2枚目 |

## ルール
- 1 段に複数枚ある場合、同じ段 id を使う
- 段 id は 1 から連番
- 内容が大きく変わる境界で段を分ける
- 不明な箇所は「要確認」と明記し、推測は推測と分ける
- 詞書（文字だけの部分）の画像が混ざっている場合、絵画との区別をメモに書く
- 詞書ありの場合、各段の現代語訳（gendaibun）の有無・出典をメモに書く（文献があれば要約可）

## 補足情報
- 時代: {{例: 平安}}
- 種別: 絵巻
- 詞書あり: {{はい / いいえ}}
- 参考 URL: {{ColBase 等}}
- 既知の段タイトル（あれば）: {{任意}}
```

**確認ポイント**: 表の global index の最大値 ＝ 画像総枚数。段の区切りが自然か人間が確認してから、プロンプト B へ進みます。

---



## プロンプト B — scroll_config.yaml 生成（第2段階）

プロンプト A の表を AI の会話に含めた状態で、以下を続けて送ります。

```markdown
上記の段構成表に基づき、次のスキーマに従った scroll_config.yaml を生成してください。

## スキーマ（この構造に従うこと）

    scroll_id: "{{kebab-case、例: jigokusoushi-anzyuin}}"
    volume_num: {{巻番号、通常 1}}
    theme_id: "{{テーマ、例: jigoku}}"
    folder: "emakimono"

    metadata:
      id: {{未使用の数値 ID。不明なら 99}}
      title: "{{日本語作品名}}"
      titleen: "{{URL スラッグ。例: jigokusoushi_anzyuin}}"
      author: ""
      authoren: ""
      edition: "{{版・巻 label}}"
      era: "{{時代（日本語）}}"
      eraen: "{{時代 slug、例: heiann}}"
      type: "絵巻"
      typeen: "emaki"
      desc: ""
      descen: ""
      thumb: "/thumb/{{scroll_id}}_thumb.webp"
      thumb2: ""
      backgroundImage: ""
      video: ""
      sourceImageUrl: "{{ColBase なら collection_items/... の当該ページ URL（トップ URL 不可）}}"
      sourceImage: "{{所蔵作品名（表示用ラベル。出典行は URL から自動生成）}}"
      encodeUrl: ""
      favorite: false
      kotobagaki: {{true または false}}
      # 地獄草紙型: kotobagaki_mode: "alternating"
      # 絵師草紙型（任意配置）: kotobagaki_mode: "explicit" + scenes[].slots
      # 餓鬼草紙型: kotobagaki_mode は省略
      readMore: false
      keywords:
        - { name: "{{日本語}}", id: "{{slug}}", slug: "{{slug}}" }

    scenes:
      - id: 1
        title: "{{段タイトル（日本語）}}"
        titleen: "{{段タイトル（英語）}}"
        range: [1, 2]
        # kotobagaki: true の場合、各 scene に text を付ける（推奨）:
        text:
          gendaibun: |
            {{現代語訳。段落区切りは <br> または <br><br>}}
          kobun: ""          # 古文・原文（任意）
          desc: ""           # 解説・注釈（任意）
          # descen: ""       # 英語解説（任意）

## 出典（ColBase 等）

ビューアの出典表示は `SourceAttribution` コンポーネントが `sourceImageUrl` から自動生成する。YAML では **当該所蔵品ページの URL** を必ず入れる。

| 出典先 | sourceImageUrl の例 | 追加フィールド |
|--------|---------------------|----------------|
| ColBase | `https://colbase.nich.go.jp/collection_items/tnm/A-1555?locale=ja` | — |
| 大英博物館 | `https://www.britishmuseum.org/collection/object/...` | CC BY-NC-SA 4.0（表示は自動） |
| Wikimedia | **File ページ URL**（カテゴリ不可） | `sourceAuthor`, `sourceCollection` |

ColBase 利用時（[利用規約](https://colbase.nich.go.jp/pages/term?locale=ja)）:

- 出典：`国立文化財機構所蔵品統合検索システム（当該ページ URL）`
- 加工あり（本サイトは Cloudinary で解像度調整・WebP 変換等）: `「国立文化財機構所蔵品統合検索システム」（当該 URL）を加工して作成` を併記
- `sourceImage` は作品名・所蔵館名のメモ用（例: `地獄草紙（益田家甲本）`）。出典行そのものには使わない

大英博物館（[Copyright and permissions](https://www.britishmuseum.org/terms-use/copyright-and-permissions)）:

- 出典：`© The Trustees of the British Museum（オブジェクト URL）`
- ライセンス：`CC BY-NC-SA 4.0` リンクを併記
- 加工行＋非営利・SA 声明を表示（`SourceAttribution` 自動）

Wikimedia Commons（CC0 等）:

- `sourceImageUrl`: 使用 File ページ（例: `.../File:Nine_Stages_..._I.JPG`）
- `sourceAuthor`: 撮影者（例: `Hiart`）
- `sourceCollection`: 所蔵情報（例: `Honolulu Museum of Art (accession 2007.3)`）
- ライセンス行（CC0 1.0）＋加工行を表示

**取り下げ済み:** HoMA eMuseum 直利用（鳥獣戯画と天狗）は複製許可が必要なため非公開。データは `src/data/withdrawn/` に退避。

## scenes / range の鉄則

- scenes の各要素は 1 段（chapter）を表す
- id: 段番号（1, 2, 3, …）
- range: [開始 index, 終了 index] の2点指定（[1,2,3] のようなリストは不可）
- global index は 1 から始まり、欠番なし、全画像をカバー
- 例: 段2に画像 index 2 と 3 がある → range: [2, 3]
- 地獄草紙型（alternating）: 1 段 = 词書 + 絵画の 2 枚 → range: [1, 2], [3, 4], …
- 絵師草紙型（explicit）: 各 scene に `slots: [image, ekotoba, …]`（range 内 index 順、長さ = 枚数）→ 例: `scrolls/_examples/eshi-no-soshi/`

## scenes[].text（词書テキスト）

`metadata.kotobagaki: true` のとき、各 scene に `text` ブロックを付ける。

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `gendaibun` | 推奨 | 現代語訳。HTML 可（`<br>` で改行） |
| `kobun` | 任意 | 古文・原文 |
| `desc` | 任意 | 解説・注釈 |
| `descen` | 任意 | 英語解説 |

- `text.title` は通常省略（`scenes.title` が使われる）
- 文献・ColBase・解説本を参照し、推測は `# TODO:` で明記
- `kotobagaki: false` の作品では `text` は不要

## 識別子のルール

- scroll_id: kebab-case（ハイフン）。フォルダ名・Cloudinary ID
- titleen: URL 用。既存ページがあればそれに合わせる（アンダースコア可）
- theme_id: kebab-case

## 出力要件

1. 完成した YAML のみを yaml コードブロックで出力
2. YAML の直前に、対応表を短く再掲（段 id / range / 枚数 / タイトル / gendaibun 有無）
3. 不確実な項目には # TODO: コメントを YAML 内に付ける
4. コメントは日本語でよい

## 固定値（このプロジェクト）

- scroll_id 案: {{例: jigokusoushi-anzyuin}}
- titleen 案: {{例: jigokusoushi_anzyuin}}
- metadata.id 案: {{例: 12、不明なら 99}}
- theme_id 案: {{例: jigoku}}
```

---



## プロンプト C — 修正・追質問用（第3段階）

草案 YAML を Cursor や人間がレビューしたあと、AI に直させるとき用です。

```markdown
以下の scroll_config.yaml について修正してください。

## 修正指示
{{例: 段3と段4を統合 / alternating 用に range を [5,6] に修正 / 段2の gendaibun を文献に合わせる / kobun を追加}}

## 現在の YAML
（ここに YAML 全文を貼る）

## 画像一覧（左から順）
{{ファイル名リスト、例: _01-1080.jpg, _02-1080.jpg, ...}}

## 出力
- 修正後の YAML のみ（yaml コードブロック）
- 変更点を箇条書きで3行以内
```

---



## プロンプト D — ワンショット（分析 + YAML 同時）

画像枚数が少ない（〜10枚）場合は、A と B をまとめて送れます。

```markdown
あなたは日本の絵巻物アーカイブ担当です。添付画像は「{{作品名}}」を左から右に並べたものです。

## やること
1. 画像を global index 1, 2, 3… と番号付け
2. 段（scene）にグループ分けし、日英タイトルを付ける
3. 対応表を出力
4. 続けて scroll_config.yaml を生成（词書ありなら各 scene に text.gendaibun も含める）

## YAML 要件
- scroll_id: "{{kebab-case}}"
- titleen: "{{slug}}"
- volume_num: 1
- theme_id: "{{theme}}"
- folder: "emakimono"
- kotobagaki: {{true/false}}
- 词書画像と絵画が交互なら `kotobagaki_mode: "alternating"`
- 非交互（词書連続・絵→词書→絵など）なら `kotobagaki_mode: "explicit"` + `scenes[].slots`
- scenes[].range は必ず [開始, 終了] の2要素
- global index は 1 始まり、欠番なし
- kotobagaki: true の各 scene に `text` ブロック:
  - `gendaibun`: 現代語訳（`|` リテラル、`<br>` 改行可）
  - `kobun`: 古文（任意）
  - `desc`: 解説（任意）
  - `descen`: 英語解説（任意）

## scenes 例（kotobagaki: true の場合）

```yaml
scenes:
  - id: 1
    title: "第1段"
    titleen: "Scene 1"
    range: [1, 2]
    text:
      gendaibun: |
        現代語訳をここに書く。<br><br>段落区切りは <br> または <br><br>。
      kobun: ""
      desc: ""
```

## 補足
- 時代: {{平安 等}}
- 所蔵: {{URL}}
- metadata.id: {{数値 or 99}}

## 出力順
1. 対応表（markdown）
2. YAML（yaml コードブロック）
3. 要確認事項（あれば）
```

---



## 生成後のチェックリスト

AI 出力を `scrolls/{scroll_id}/scroll_config.yaml` に保存する前に確認:

- [ ] `scroll_id` は kebab-case（ハイフン）かつ **フォルダ名と一致**
- [ ] `scenes` の `range` はすべて `[n, m]` 形式（2要素）
- [ ] global index が 1 から連続し、**画像枚数と一致**
- [ ] 各 `scenes.id` は 1 から連番
- [ ] `metadata.titleen` が意図した URL スラッグと一致
- [ ] `metadata.id` が **dataEmakis.json の既存 ID と重複しない**
- [ ] 詞書ありの作品は `kotobagaki: true`
- [ ] 地獄草紙型は `kotobagaki_mode: "alternating"` と range が [1,2], [3,4], … の2枚1組
- [ ] 絵師草紙型（非交互）は `kotobagaki_mode: "explicit"` と `slots` 長 = range 枚数（例: `scrolls/eshi-no-soshi/`）
- [ ] 各 scene に `text.gendaibun` がある（または `# TODO:` で未作成を明記）
- [ ] `text` の現代語訳が文献・画像内容と矛盾していない
- [ ] 各画像 **≤ 10 MB**（Cloudinary Free）

### 機械チェック（ローカル）

[`scroll-pipeline.md`](./scroll-pipeline.md) Phase 0〜2 に従う:

```powershell
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/preflight_scroll.py scrolls/{scroll_id}/scroll_config.yaml
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --dry-run
```

- preflight が **Preflight OK** になること
- dry-run の `public_id` が B 形式（`scroll-id__scroll-id_1_01__01`）
- 画像枚数 = `scenes` range 合計

PR では `.github/workflows/validate-scroll.yml` が同内容を自動実行（upload なし）。

---



## 配置先

AI が生成した YAML と画像:

```
scrolls/{scroll_id}/
├── scroll_config.yaml    ← AI 出力を保存
└── images/
    ├── _01-1080.jpg
    └── ...
```

テンプレート: `scrolls/_template/scroll_config.yaml`  
完成例: `scrolls/_examples/choju-giga-yamazaki-tei/scroll_config.yaml`

---



## 使用例 — 地獄草紙（安住院本）を新規追加する場合

**プロンプト A に渡す補足**:

```
作品名: 地獄草紙（安住院本）
所蔵: 東京国立博物館（ColBase A-10942）
時代: 平安
詞書あり: はい
theme_id 案: jigoku
scroll_id 案: jigokusoushi-anzyuin
titleen 案: jigokusoushi_anzyuin
```

**期待する scenes のイメージ**（词書+絵画 4 段 = 画像 8 枚の場合）:

```yaml
metadata:
  kotobagaki: true
  kotobagaki_mode: "alternating"

scenes:
  - id: 1
    title: "叫喚地獄第三別所・髪火流"
    titleen: "Kyokan Hell - 3rd Bessho: Hatsukaru"
    range: [1, 2]
    text:
      gendaibun: |
        ここは、生前、殺生、偸盗・邪淫・妄語をおこない…<br><br>この地獄には、熱鉄の犬や…
      kobun: ""
      desc: ""
  - id: 2
    title: "叫喚地獄第四別所・火末虫"
    titleen: "Kyokan Hell - 4th Bessho: Kamatsumushi"
    range: [3, 4]
    text:
      gendaibun: |
        …
      kobun: ""
      desc: ""
  # …
```

段タイトル・現代語訳は文献・ColBase の解説に合わせて AI に具体名を付けさせてください。

---



## Cursor への引き継ぎ

YAML ができたあとは **[`cursor-scroll-sync-prompt.md`](./cursor-scroll-sync-prompt.md)** のプロンプト（標準または短縮版）を Cursor Agent に渡してください。

---



## 関連ドキュメント

- [`scroll-pipeline.md`](./scroll-pipeline.md) — 自動化パイプライン正本（手順・CI・運用）
- [`cursor-scroll-sync-prompt.md`](./cursor-scroll-sync-prompt.md) — Cursor Agent 用 sync プロンプト
- [`naming-convention.md`](./naming-convention.md) — Cloudinary B 形式
- [`scrolls/README.md`](../../scrolls/README.md) — ディレクトリ構成

