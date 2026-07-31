# シーンテキスト生成プロンプト集（汎用 AI 用）

絵巻シーンの「現代文（gendaibun）・解説文（desc/descen）」を AI に生成・リライトさせるためのプロンプト集です。
ChatGPT・Claude・Gemini など、画像入力に対応した AI にそのまま貼り付けて使えます。

**方針の正本:** [`scene-text-policy.md`](./scene-text-policy.md)
**既存の YAML 生成プロンプト:** [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md)（シーン構成の分析はこちら）

---

## このプロンプトの位置づけ

```
[1] 汎用 AI  ← 本ドキュメント（シーンテキスト草案）
      ↓
[2] 人間レビュー（語数・対訳・出典）
      ↓
[3] 反映先（2 択）
     a. scrolls/{scroll_id}/scroll_config.yaml の scenes[].text
     b. src/data/emaki-text-data/{titleen}.json（YAML を持たない巻）
      ↓
[4] scripts/sync_all.py（YAML 管轄巻のみ、--dry-run → 本番）
      ↓
[5] npm run build で検証
```

---

## 事前準備（AI に渡す前）

1. **各シーンの絵画画像**を読書順（右→左の進行方向）に並べる
   - YAML 管轄巻: `scrolls/{scroll_id}/images/` の連番画像
   - その他の巻: Cloudinary URL 一覧（`image-metadata-cache.json` の `emakis[]` から抽出）
2. 以下が分かると精度が上がる:
   - 作品名・所蔵・巻数・時代
   - 既存の段タイトル（`title` / `titleen`）
   - 詞書の原文（`kobun`、あれば）
   - 参考文献や解説サイトの URL
3. テキスト生成ルールは `scene-text-policy.md` の「第 3 章 フィールド契約」「第 4 章 2 層テキスト原則」に従う

---

## プロンプト A — シーンテキスト新規生成（第 1 段階）

画像（または画像 URL 一覧）と既存の段構成を添付したうえで、以下をコピーして使います。
`{{...}}` 部分を実際の値に置き換えてください。

```markdown
あなたは日本の絵巻物（emaki）のデジタルアーカイブ担当です。
対象は「{{作品名}}」（{{所蔵・版}}、{{時代}}）です。各シーンの画像を添付します。

## タスク
各シーン（段）について、次の 4 フィールドを生成してください。
1. gendaibun（日本語・現代文）: 詞書がある場合はその現代語訳、ない場合は場面の平易な描写。1〜3 文
2. desc（日本語・解説）: 背景・絵画表現・文化的文脈。3〜6 文
3. descen（英語・解説）: desc の英訳。3〜6 文
4. kobun: 原文（古文）。詞書の画像やテキストがある場合のみ、ない場合は空文字

## シーン構成（既存の段タイトル）
| chapter | title（日本語） | titleen（英語） |
|---|---|---|
| 1 | … | … |
| 2 | … | … |

## ルール
- gendaibun は「何が描かれているか」を具体的に描写。一文を短く、漢語・専門語は初出で一言補足
- desc は背景・技法・文化文脈を中心に。推測は「〜と考えられています」等で明示
- ja / en は内容を揃える（直訳でなく自然な英語に）
- 不確実な箇所は「要確認」と明記し、推測は推測と分ける
- 出典（ColBase 等）の情報を反映できる場合は、その URL を補足として使用

## 出力形式（JSON）
{
  "scrolls": [
    {
      "chapter": "1",
      "gendaibun": "…",
      "kobun": "…",
      "desc": "…",
      "descen": "…"
    }
  ]
}

## 補足情報
- 詞書の有無: {{はい（kotobagaki: true）/ いいえ}}
- 参考 URL: {{ColBase 等}}
- 特に調べてほしい点: {{任意}}
```

---

## プロンプト B — 既存テキストのリライト（第 2 段階）

既存の `emaki-text-data/{titleen}.json` や `scenes[].text` を方針に合わせて改善するとき用です。

```markdown
以下のシーンテキストを、絵巻サイトの「2 層テキスト」方針に合わせてリライトしてください。

## リライト方針
- gendaibun: 1〜3 文に圧縮。漢語を避け、情景を具体的に描写。専門語は初出で一言補足
- desc: 3〜6 文で背景・絵画表現・文化的文脈を解説。推測は「〜と考えられています」等で明示
- descen: desc の英訳（自然な英語に）
- 不確実な箇所は「要確認」と明記

## 現在のテキスト（JSON 配列）
（ここに emaki-text-data JSON または YAML の scenes[].text を貼る）

## 出力
- リライト後の JSON（全シーン・全フィールド）
- 変更点を箇条書きで 3 行以内
```

---

## プロンプト C — 修正・追質問用（第 3 段階）

生成結果をレビューして直させるとき用です。

```markdown
以下のシーンテキストについて修正してください。

## 修正指示
{{例: シーン 3 の desc が長すぎるので 3 文に圧縮 / シーン 5 の descen を自然な英語に / シーン 2 の gendaibun に「〜と考えられています」の推測表現を追加}}

## 現在のテキスト（JSON 配列）
（ここに修正前の JSON を貼る）

## 出力
- 修正後の JSON（全シーン・全フィールド）
- 変更点を箇条書きで 3 行以内
```

---

## 生成後のチェックリスト

- [ ] 各シーンに `gendaibun` がある（または `# TODO:` で未作成を明記）
- [ ] `ja` / `en` が揃っている（`descen` 含む）
- [ ] 層 1（gendaibun）は 1〜3 文、層 2（desc/descen）は 3〜6 文
- [ ] 推測は「〜と考えられています」等で明示
- [ ] 出典（ColBase 等）と矛盾していない
- [ ] 漢語・専門語に初出の補足がある
- [ ] 既存の段タイトル（`title` / `titleen`）を変更していない

---

## 反映手順

### YAML 管轄巻（`scrolls/{scroll_id}/` が存在する巻）

```powershell
# 1. scroll_config.yaml の scenes[].text を編集
# 2. ドライラン
$env:PYTHONIOENCODING = "utf-8"
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --dry-run
# 3. 本番 sync（JSON 生成のみ。画像変更がなければ --skip-upload）
py -3.14 scripts/sync_all.py scrolls/{scroll_id}/scroll_config.yaml --skip-upload
```

### YAML を持たない巻（鳥獣戯画・九相図等）

`src/data/emaki-text-data/{titleen}.json` を直接編集する。
`chapter` は `image-metadata-cache.json` の ekotoba マーカーと一致させること。

---

## 関連ドキュメント

- [`scene-text-policy.md`](./scene-text-policy.md) — リライト方針の正本
- [`ai-scroll-config-prompt.md`](./ai-scroll-config-prompt.md) — シーン構成・YAML 生成プロンプト
- [`scroll-pipeline.md`](./scroll-pipeline.md) — sync パイプライン正本
- [`data-model.md`](./data-model.md) — JSON / slug / scroll_id の関係
