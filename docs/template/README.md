# docs/template — scroll_config テンプレート

絵巻 sync 用 `scroll_config.yaml` の**構成正本**（ファイル置き場）。

| ファイル | 用途 |
|----------|------|
| [`scroll_config.scene-text.yaml`](./scroll_config.scene-text.yaml) | **sceneText 型** — 詞書なし。`scenes[].text` は `desc` / `descen` のみ |

## 完成例（本番）

- 百鬼ノ図（日文研）: `scrolls/hyakki-yakou/hyakki-no-zu-nichibun/scroll_config.yaml`
- 新規雛形（词書あり等）: `scrolls/_template/scroll_config.yaml`

## 使い方

1. `scroll_config.scene-text.yaml` を `scrolls/{scroll_id}/scroll_config.yaml` にコピー
2. `scroll_id`・`metadata`・`scenes` を編集（段数 = 画像枚数）
3. `images/_01-1080.jpg` … を配置
4. [`scroll-pipeline.md`](../operations/scroll-pipeline.md) の preflight → dry-run → sync

関連: [`ai-scroll-config-prompt.md`](../operations/ai-scroll-config-prompt.md) · [`scene-text-policy.md`](../operations/scene-text-policy.md)
