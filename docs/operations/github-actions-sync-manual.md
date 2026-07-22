# GitHub Actions 同期実行・運用マニュアル

> ローカルの画像とメタデータを Cloudinary / Supabase へアップロードする手順書。
> 出典: Notion「絵巻物ビューアー」→「GitHub Actions 実行・運用マニュアル」＋サブページ

## 全体フロー

```mermaid
graph LR
    A[ローカル画像] -->|命名規則に従って配置| B(画像フォルダ準備)
    B --> C{設定ファイル準備}
    C -->|scroll_config.yaml| D[リポジトリルート直下に配置]
    C -->|metadata.yaml| E[画像フォルダ内に配置]
    D & E --> F{ドライラン確認}
    F -->|OKなら| G[Git Push / Action起動]
    G --> H((同期完了))

    style F fill:#f96,stroke:#333
    style H fill:#3ecf8e,stroke:#333
```

## 目次

1. [画像の準備と命名規則](#1-画像の準備と命名規則)
2. [`scroll_config.yaml` の編集](#2-scroll_configyaml-の編集)
3. [`metadata.yaml` の作成](#3-metadatayaml-の作成)
4. [検証：ドライラン](#4-検証ドライラン)
5. [GitHub Actions での実行](#5-github-actions-での実行)
6. [後片付け](#6-後片付け)
7. [付録：データベース設計](#7-付録データベース設計)
8. [付録：ユーティリティSQL](#8-付録ユーティリティsql)

---

## 1. 画像の準備と命名規則

### 1.1 ファイル名の基本フォーマット

```
[scroll_id]__[scene_id]__[suffix].jpg
```

各要素を **アンダースコア2つ `__`** で区切ります。

| パーツ | 説明 | 例 |
|--------|------|-----|
| `scroll_id` | 作品全体のID | `choju-jinbutsu-giga_first` |
| `scene_id` | 段（シーン）ごとのユニークID | `choju_giga_1_01` |
| `suffix` | `bg` = 段タイトルの背景画像 / `01,02,...` = 通常画像 | `bg`, `01`, `02` |

### 1.2 具体例（鳥獣戯画の場合）

| 画像の役割 | ファイル名 |
|-----------|-----------|
| 第1段の背景 | `choju-jinbutsu-giga_first__choju_giga_1_01__bg.jpg` |
| 第1段の1枚目 | `choju-jinbutsu-giga_first__choju_giga_1_01__01.jpg` |
| 第1段の2枚目 | `choju-jinbutsu-giga_first__choju_giga_1_01__02.jpg` |
| 第2段の背景 | `choju-jinbutsu-giga_first__choju_giga_1_02__bg.jpg` |
| 第2段の1枚目 | `choju-jinbutsu-giga_first__choju_giga_1_02__01.jpg` |

### 1.3 ファイル名の掟（注意点）

- **正:** `scroll-id_01-1080.jpg`（アンダースコアの後に2桁の番号）
- **誤:** `scroll-id-01.jpg`（ハイフンだと番号を拾えない場合あり）
- プログラムが「巻数」と「枝番」を正しく認識できるように命名すること

### 1.4 一括リネーム（救済スクリプト）

複雑な既存ファイル名を一括変換する場合：

```bash
# アンダースコアの後の2桁の数字を抽出してリネーム
for f in *.jpg; do
  num=$(echo $f | sed -E 's/.*_([0-9]{2})-.*/\1/')
  mv "$f" "choju-giga-yamazaki-kou_$num.jpg"
done
```

---

## 2. `scroll_config.yaml` の編集

作品の骨組みを定義する設定ファイルです。**リポジトリルート直下**に配置します。

### 2.1 基本スキーマ

```yaml
# yaml-language-server: $schema=./scroll-config-schema.json
scroll_id: "<作品ID>"
volume_num: <巻番号>
theme_id: "<テーマID>"
folder: "emakimono"
scenes:
  - scene_id: <連番>
    common_id: "<マスターID>"   # master_texts と紐づく共通ID
    title: "<段タイトル>"
    range: [開始, 終了]         # ★ リストではなく「区間指定」
```

### 2.2 【鉄則】`range` は「区間指定」

`[1, 2, 3]` のようなリストではなく、必ず **`[開始, 終了]`** の2点指定にします。
例: `range: [1, 4]` → 1番〜4番の4枚を自動補完

### 2.3 実例：九相図巻（国立歴史民俗博物館蔵）

```yaml
scroll_id: "kuso-zu-emaki"
volume_num: 1
theme_id: "kuso-zu"
folder: "emakimono"
scenes:
  - scene_id: 1
    common_id: "kuso-zu-0"
    title: "生前相"
    range: [1, 1]
  - scene_id: 2
    common_id: "kuso-zu-1"
    title: "脹相"
    range: [2, 2]
  - scene_id: 3
    common_id: "kuso-zu-2"
    title: "壊相"
    range: [3, 3]
  - scene_id: 4
    common_id: "kuso-zu-3"
    title: "血塗相"
    range: [4, 4]
  - scene_id: 5
    common_id: "kuso-zu-4"
    title: "膿爛相"
    range: [5, 5]
  - scene_id: 6
    common_id: "kuso-zu-5"
    title: "青瘀相"
    range: [6, 6]
  - scene_id: 7
    common_id: "kuso-zu-6"
    title: "噉相"
    range: [7, 7]
  - scene_id: 8
    common_id: "kuso-zu-7"
    title: "散相"
    range: [8, 8]
  - scene_id: 9
    common_id: "kuso-zu-8"
    title: "骨相"
    range: [9, 9]
  - scene_id: 10
    common_id: "kuso-zu-9"
    title: "焼相"
    range: [10, 10]
```

### 2.4 実例：鳥獣人物戯画 丁巻

```yaml
scroll_id: "choju-giga-yamazaki-tei"
volume_num: 4
theme_id: "choju-giga"
folder: "emakimono"
scenes:
  - id: 1
    title: "侏儒たちの脱出劇"
    range: [1, 1]
  - id: 2
    title: "神秘の験くらべ"
    range: [2, 3]
  - id: 3
    title: "供養に結ばれし縁者たち"
    range: [4, 5]
  - id: 4
    title: "流鏑馬 ― 神聖なる騎射の儀式"
    range: [6, 7]
  - id: 5
    title: "田楽 ― 五穀豊穣を祝う舞"
    range: [8, 8]
  - id: 6
    title: "毬打 ― 優雅なる球戯"
    range: [9, 9]
  - id: 7
    title: "木遣り ― 韻律に乗せる力の歌"
    range: [10, 12]
  - id: 8
    title: "公卿たちの論議の座"
    range: [13, 13]
  - id: 9
    title: "印地打ち ― 神事の石投げ合戦"
    range: [14, 14]
  - id: 10
    title: "大臣、天子に拝賀す"
    range: [15, 18]
```

### 2.5 実例：九相図（ホノルル美術館蔵）

```yaml
scroll_id: "kusouzu-honolulu"
volume_num: 1
theme_id: "kuso-zu"
folder: "emakimono"
scenes:
  - scene_id: 1
    common_id: "kuso-zu-0"
    title: "生前相"
    range: [1, 1]
  - scene_id: 2
    common_id: "kuso-zu-1"
    title: "新死相"
    range: [2, 2]
  - scene_id: 3
    common_id: "kuso-zu-2"
    title: "脹相"
    range: [3, 3]
  - scene_id: 4
    common_id: "kuso-zu-3"
    title: "壊相"
    range: [4, 4]
  - scene_id: 5
    common_id: "kuso-zu-7"
    title: "散相"
    range: [5, 5]
  - scene_id: 6
    common_id: "kuso-zu-8"
    title: "骨相"
    range: [6, 6]
```

---

## 3. `metadata.yaml` の作成

各シーンの解説文（日本語・英語）を定義します。

- **設置場所:** 各画像フォルダの中
  （例: `public/images/jigokusoushi-anzyuin/metadata.yaml`）
- **ルール:** `metadata-schema.json` の形式に従うこと

---

## 4. 検証：ドライラン

いきなりアップロードせず、**「何枚の画像が、どのIDで紐付けられるか」** をローカルで確認します。

```bash
# リポジトリのトップレベルで実行
python scripts/sync_scroll.py scroll_config.yaml --dry-run
```

### チェックポイント

- [ ] `Found XX image file(s)` と `XX global index bucket(s)` の数字が一致しているか？
- [ ] `images=XX` の合計枚数が想定通りか？
- [ ] `public_id` が `__01` のようにダブルアンダースコアになっているか？

---

## 5. GitHub Actions での実行

### A. 自動実行（Git Push）

1. `scroll_config.yaml` を**リポジトリルート直下**に置く
2. 画像と設定ファイルを `git add` / `commit` / `push`
3. GitHub Actions が自動で起動し、Cloudinary + Supabase を更新

### B. 手動実行（安心・確実）

Push 後に GitHub の画面から手動で着火：

1. リポジトリの **Actions** タブを開く
2. **"Sync scroll to Cloudinary and Supabase"** を選択
3. **Run workflow** ボタンをクリック

### 必要な環境変数（リポジトリ Secrets）

| Secret名 | 説明 |
|----------|------|
| `CLOUDINARY_URL` | Cloudinary API URL（`cloudinary://api_key:api_secret@cloud_name`） |
| （または個別指定）`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `SUPABASE_URL` | Supabase プロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |

### ローカル実行（デバッグ用）

```bash
pip install -r scripts/requirements-sync.txt

# 環境変数設定
$env:CLOUDINARY_URL = "cloudinary://api_key:api_secret@cloud_name"
$env:SUPABASE_URL = "https://xxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "..."

# オプション: 画像ディレクトリ指定（未設定時は images/<scroll_id>/）
$env:SCROLL_IMAGES_DIR = "./images/choju-giga-yamazaki-hei"

python scripts/sync_scroll.py scroll_config.yaml
python scripts/sync_scroll.py scroll_config.yaml --dry-run    # 実行せず確認
python scripts/sync_scroll.py scroll_config.yaml --skip-upload # DBのみ更新
```

---

## 6. 後片付け

同期が終わったら、リポジトリルートにある `scroll_config.yaml` を各画像ディレクトリ（バックアップ用）に戻してルートを綺麗にしておきます。

理由：次に別の絵巻を同期する際、古い設定ファイルが混ざるのを防ぐため。

---

## 7. 付録：データベース設計

### 7.1 Supabase ER図

```mermaid
erDiagram
    master_texts ||--o{ scene_titles : "1:N (common_id)"
    scene_titles ||--o{ images : "1:N (scene_id)"

    master_texts {
        text common_id PK "例: kusouzu_m_01"
        text theme_id "例: kusouzu"
        text title "章のタイトル"
        text title_en "英語タイトル"
        text description "解説文（現代語訳）"
        timestamp created_at
    }

    scene_titles {
        text scene_id PK "例: kusouzu-seikado_1_01"
        text common_id FK "master_textsを参照"
        text scroll_id "作品バージョンID"
        integer chapter "章番号"
        text theme_id "テーマID"
        text src "背景画像(詞書)URL"
        integer width "横幅"
        integer height "縦幅"
        timestamp created_at
    }

    images {
        bigint id PK "自動採番"
        text image_id UK "一意の画像ID"
        text scene_id FK "scene_titlesを参照"
        text scroll_id "作品バージョンID"
        text src "画像URL"
        integer width "横幅"
        integer height "縦幅"
        integer sort_key "並び順"
        timestamp created_at
    }
```

### 7.2 テーブル定義（Supabase）

```sql
CREATE TABLE public.scrolls (
    scroll_id    text NOT NULL,
    title        text NOT NULL,
    era_id       text,
    type_id      text,
    author_id    text,
    thumbnail    text,
    created_at   timestamp with time zone DEFAULT timezone('utc'::text, now()),
    description  text,
    description_en text,
    theme_id     text,
    version_id   text,
    source_id    text,
    id           smallint,
    favorite     boolean DEFAULT false,
    CONSTRAINT scrolls_pkey PRIMARY KEY (scroll_id)
);

CREATE TABLE public.scene_titles (
    scene_id     text NOT NULL,
    common_id    text,
    scroll_id    text NOT NULL,
    chapter      integer NOT NULL,
    theme_id     text,
    src          text,
    width        integer,
    height       integer,
    created_at   timestamp with time zone DEFAULT timezone('utc'::text, now()),
    sort_key     integer,
    CONSTRAINT scene_titles_pkey PRIMARY KEY (scene_id)
);

CREATE TABLE public.images (
    id           bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    image_id     text NOT NULL,
    scene_id     text,
    scroll_id    text NOT NULL,
    src          text NOT NULL,
    width        integer,
    height       integer,
    sort_key     integer NOT NULL,
    created_at   timestamp with time zone DEFAULT timezone('utc'::text, now()),
    tags         ARRAY DEFAULT '{}'::text[],
    CONSTRAINT images_pkey PRIMARY KEY (image_id)
);

CREATE TABLE public.master_texts (
    common_id       text NOT NULL,
    theme_id        text NOT NULL,
    title           text NOT NULL,
    title_en        text,
    description     text,
    created_at      timestamp with time zone DEFAULT timezone('utc'::text, now()),
    description_en  text,
    CONSTRAINT master_texts_pkey PRIMARY KEY (common_id)
);

CREATE TABLE public.authors (
    author_id   text NOT NULL,
    name        text NOT NULL,
    description text,
    CONSTRAINT authors_pkey PRIMARY KEY (author_id)
);

CREATE TABLE public.eras (
    era_id  text NOT NULL,
    name    text NOT NULL,
    CONSTRAINT eras_pkey PRIMARY KEY (era_id)
);

CREATE TABLE public.keywords (
    keyword_id  text NOT NULL,
    name        text NOT NULL,
    slug        text NOT NULL,
    CONSTRAINT keywords_pkey PRIMARY KEY (keyword_id)
);

CREATE TABLE public.personnames (
    person_id   text NOT NULL,
    name        text NOT NULL,
    name_en     text NOT NULL,
    CONSTRAINT personnames_pkey PRIMARY KEY (person_id)
);

CREATE TABLE public.sources (
    source_id   text NOT NULL,
    url         text,
    name        text NOT NULL,
    CONSTRAINT sources_pkey PRIMARY KEY (source_id)
);

CREATE TABLE public.types (
    type_id text NOT NULL,
    name    text NOT NULL,
    CONSTRAINT types_pkey PRIMARY KEY (type_id)
);

-- 中間テーブル
CREATE TABLE public.scroll_keywords (
    scroll_id   text NOT NULL,
    keyword_id  text NOT NULL,
    CONSTRAINT scroll_keywords_pkey PRIMARY KEY (scroll_id, keyword_id)
);

CREATE TABLE public.scroll_personnames (
    scroll_id     text NOT NULL,
    personname_id text NOT NULL,
    CONSTRAINT scroll_personnames_pkey PRIMARY KEY (scroll_id, personname_id)
);
```

### 7.3 upsert に必要なユニーク制約

`supabase-sync-constraints.sql` を参照し、必要に応じて SQL エディタで実行：

- `scene_titles`: `(scroll_id, volume_num, chapter)` でユニーク
- `images`: `(scroll_id, volume_num, chapter, index)` でユニーク

---

## 8. 付録：ユーティリティSQL

### 8.1 関連データを一括削除

```sql
-- 作品 "kusouzu-kyuhaku" を完全削除する場合
DELETE FROM scroll_keywords WHERE scroll_id = 'kusouzu-kyuhaku';
DELETE FROM scene_titles WHERE scroll_id = 'kusouzu-kyuhaku';
DELETE FROM images WHERE scroll_id = 'kusouzu-kyuhaku';
DELETE FROM scrolls WHERE scroll_id = 'kusouzu-kyuhaku';
```

### 8.2 画像の連番を振り直し

```sql
WITH renumbered_images AS (
  SELECT
    image_id,
    row_number() OVER (PARTITION BY scroll_id ORDER BY id ASC) as new_id
  FROM images
)
UPDATE images
SET id = renumbered_images.new_id
FROM renumbered_images
WHERE images.image_id = renumbered_images.image_id;
```

### 8.3 フロントエンド用データ取得関数

```sql
CREATE OR REPLACE FUNCTION get_emaki_data(target_id text)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT jsonb_build_object(
    'emakis', (
      SELECT jsonb_agg(item ORDER BY sort_key ASC)
      FROM (
        -- scene_titles 由来のデータ
        SELECT
          'scene_title' AS cat,
          st.src, mt.title, st.width, st.height,
          st.chapter, st.scene_id,
          (st.chapter * 100) AS sort_key,
          mt.title_en, st.scroll_id,
          NULL AS name, NULL AS config
        FROM public.scene_titles st
        LEFT JOIN public.master_texts mt ON st.common_id = mt.common_id
        WHERE st.scroll_id = s.scroll_id
        UNION ALL
        -- images 由来のデータ
        SELECT
          'image' AS cat,
          img.src, NULL AS title, img.width, img.height,
          st_img.chapter, img.scene_id, img.sort_key,
          NULL AS title_en, img.scroll_id,
          'image' AS name, 'cloudinary' AS config
        FROM public.images img
        JOIN public.scene_titles st_img ON img.scene_id = st_img.scene_id
        WHERE img.scroll_id = s.scroll_id
      ) item
    ),
    'metadata', jsonb_build_object(
      'id', s.id, 'era', e.name, 'eraen', e.era_id,
      'type', t.name, 'typeen', t.type_id,
      'title', s.title, 'titleen', s.scroll_id,
      'author', a.name, 'authoren', a.author_id,
      'source', jsonb_build_object('url', src.url, 'name', src.name),
      'keyword', (
        SELECT jsonb_agg(jsonb_build_object('id', k.keyword_id, 'name', k.name, 'slug', k.slug))
        FROM public.scroll_keywords sk
        JOIN public.keywords k ON sk.keyword_id = k.keyword_id
        WHERE sk.scroll_id = s.scroll_id
      ),
      'scroll_id', s.scroll_id,
      'personname', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', p.name, 'name_en', p.name_en))
        FROM public.scroll_personnames sp
        JOIN public.personnames p ON sp.person_id = p.person_id
        WHERE sp.scroll_id = s.scroll_id
      ), '[]'::jsonb),
      'desc', s.description,
      'descen', s.description_en
    )
  )
  FROM public.scrolls s
  LEFT JOIN public.eras e ON s.era_id = e.era_id
  LEFT JOIN public.authors a ON s.author_id = a.author_id
  LEFT JOIN public.types t ON s.type_id = t.type_id
  LEFT JOIN public.sources src ON s.source_id = src.source_id
  WHERE s.scroll_id = target_id;
$$;
```

---

## 参考

- 同期スクリプトの詳細仕様: [`docs/operations/sync-scroll.md`](./sync-scroll.md)
- Cloudinary / Supabase 接続設定: `.env.local`（ローカル） / GitHub Secrets（本番）
- GitHub Actions ワークフロー: `.github/workflows/sync-scroll.yml`
