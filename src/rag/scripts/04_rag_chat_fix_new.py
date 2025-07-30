# rag_chat_fix_final.py
# ✅ ローカルRAG：FAISSベースの文脈検索 + distilgpt2による生成
# ✅ バグ対策：応答崩壊（無限ループや：：：繰返し）防止 + debug出力

import faiss
import json
import os
import re
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline, GPT2Tokenizer

# ========================
# 🔹 1. モデルとトークナイザーのロード
# ========================
# ベクトル化モデル：MiniLM（384次元）
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# テキスト生成モデル：distilgpt2（軽量GPT2）
language_model = pipeline("text-generation", model="distilgpt2")

# GPT2トークナイザー（pad_tokenがないため、eos_tokenをpadとして代用）
tokenizer = GPT2Tokenizer.from_pretrained("distilgpt2")
tokenizer.pad_token = tokenizer.eos_token

# ========================
# 🔹 2. JSONLファイルから埋め込みと文情報を読み込む
# ========================
def load_jsonl_embeddings(path):
    entries = []  # テキストとメタ情報
    vectors = []  # FAISS用ベクトル
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            entries.append(obj)
            vectors.append(np.array(obj['embedding'], dtype='float32'))
    return entries, np.vstack(vectors)

# ========================
# 🔹 3. FAISSインデックスを読み込む
# ========================
def load_faiss_index(index_path):
    return faiss.read_index(index_path)

# ========================
# 🔹 4. ユーザーから質問を受け取り、ベクトル化
# ========================
query = input("📥 質問をどうぞ：")
query_embedding = embedding_model.encode([query], convert_to_numpy=True).astype('float32')

# ========================
# 🔹 5. 文データとFAISSインデックスのロード
# ========================
entries, _ = load_jsonl_embeddings(os.path.join("..", "data/embeddings", "kou_embedding_ready.jsonl_sentences.jsonl"))
index = load_faiss_index(os.path.join("..", "data/embeddings", "faiss.index"))

# ========================
# 🔹 6. クエリに対して類似文を上位5件検索（コサイン類似）
# ========================
D, I = index.search(query_embedding, k=5)  # D: 類似スコア, I: インデックス番号

# ========================
# 🔹 7. 類似度でフィルタ（閾値以下は無視。なければfallback）
# ========================
SIMILARITY_THRESHOLD = 0.5
retrieved = [(entries[idx]['text'], D[0][j]) for j, idx in enumerate(I[0]) if D[0][j] >= SIMILARITY_THRESHOLD]

# スコアが全て閾値未満なら、最も近い1件を強制採用
if not retrieved:
    fallback_idx = I[0][0]
    retrieved = [(entries[fallback_idx]['text'], D[0][0])]
    print("⚠️ 閾値を下回ったため最も近い文を1件使用します。")

# ========================
# 🔹 8. 検索文脈から長さ制限付きでコンテキストを生成
# ========================
MAX_CONTEXT_TOKENS = 800
context_sentences = []
total_tokens = 0

# トークン数の合計が上限を超えないように文を追加
for text, _ in retrieved:
    entry = next((e for e in entries if e["text"] == text), None)
    if entry and "tokens" in entry:
        if total_tokens + entry["tokens"] <= MAX_CONTEXT_TOKENS:
            context_sentences.append(text)
            total_tokens += entry["tokens"]

context = "\n\n".join(context_sentences)

# ========================
# 🔹 9. RAG用プロンプトを作成（GPT2に渡す指示文）
# ========================
prompt = f"""あなたは鳥獣戯画・甲巻の専門AIです。
次の文脈に基づいて質問に日本語で答えてください。
情報がなければ「その件については文脈に情報がありません」と答えてください。

文脈:
{context}

質問:
{query}

答え："""

# ========================
# 🔹 10. トークン数でプロンプトをカット（最大1024制限）
# ========================
inputs = tokenizer(prompt, truncation=True, max_length=1000, return_tensors="pt")
trimmed_prompt = tokenizer.decode(inputs["input_ids"][0])

# ========================
# 🔹 11. 応答生成（安定パラメータ設定）
# ========================
result = language_model(
    trimmed_prompt,
    max_new_tokens=100,     # 応答は最大100トークンまで生成
    do_sample=False,        # ランダム性をなくし再現性を確保
    pad_token_id=50256      # GPT2用の文末トークン
)[0]['generated_text']

# ========================
# 🔹 12. 応答クリーンアップ（崩壊・無限ループ防止）
# ========================
# プロンプト部分を除去
generated_raw = result.replace(trimmed_prompt, "").strip()

# 「答え：」以降だけ抽出（万一複数ある場合も対応）
if "答え：" in generated_raw:
    generated_clean = generated_raw.split("答え：")[-1].strip()
else:
    generated_clean = generated_raw

# 不自然な繰り返しや記号（：：：など）を正規化
generated_clean = re.sub(r"[：:\.]{3,}", "。", generated_clean)
generated_clean = re.sub(r"。+", "。", generated_clean).strip()

# 応答が短すぎる場合、最初の文だけ取って補完
if len(generated_clean) < 5:
    generated_clean = generated_raw.split("。")[0] + "。"

# ========================
# 🔹 13. デバッグ表示（類似文とスコア）
# ========================
DEBUG = True
if DEBUG:
    print("\n--- 🔍 Debug info ---")
    for i, (text, score) in enumerate(retrieved):
        print(f"{i+1}. ({score:.4f}) {text[:60]}...")

# ========================
# 🔹 14. 応答出力（最終表示）
# ========================
print("\n💡 回答:")
print(generated_clean)
