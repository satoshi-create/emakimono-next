# 04_rag_chat.py
# ✅ OpenAI API不要・ローカルベースの簡易RAGシステム（安定化＋デバッグ対応版）

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
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
language_model = pipeline("text-generation", model="distilgpt2")
tokenizer = GPT2Tokenizer.from_pretrained("distilgpt2")
tokenizer.pad_token = tokenizer.eos_token  # GPT2にはpad_tokenがないためeosで代用

# ========================
# 🔹 2. 埋め込みファイル読み込み関数
# ========================
def load_jsonl_embeddings(path):
    entries = []
    vectors = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            entries.append(obj)
            vectors.append(np.array(obj['embedding'], dtype='float32'))
    return entries, np.vstack(vectors)

# ========================
# 🔹 3. FAISSインデックス読み込み関数
# ========================
def load_faiss_index(index_path):
    return faiss.read_index(index_path)

# ========================
# 🔹 4. クエリ入力とエンコード
# ========================
query = input("📥 質問をどうぞ：")
query_embedding = embedding_model.encode([query], convert_to_numpy=True).astype('float32')

# ========================
# 🔹 5. データとFAISSインデックスのロード
# ========================
entries, vectors = load_jsonl_embeddings(os.path.join("..", "data/embeddings", "kou_embedding_ready.jsonl_sentences.jsonl"))
index = load_faiss_index(os.path.join("..", "data/embeddings", "faiss.index"))

# ========================
# 🔹 6. FAISS検索（上位k件）
# ========================
D, I = index.search(query_embedding, k=5)

# ========================
# 🔹 7. スコア閾値でフィルタリング（cosine類似度：高いほど近い）
SIMILARITY_THRESHOLD = 0.5
retrieved = [(entries[idx]['text'], D[0][j]) for j, idx in enumerate(I[0]) if D[0][j] >= SIMILARITY_THRESHOLD]

if not retrieved:
    print("\n⚠️ 質問に関連する情報が見つかりませんでした。")
    exit()

# ========================
# 🔹 8. 文脈作成（長さ制限）
# ========================
MAX_CONTEXT_TOKENS = 800
context_sentences = []
total_tokens = 0
for text, _ in retrieved:
    entry = next((e for e in entries if e["text"] == text), None)
    if entry:
        if total_tokens + entry["tokens"] <= MAX_CONTEXT_TOKENS:
            context_sentences.append(text)
            total_tokens += entry["tokens"]

context = "\n\n".join(context_sentences)

if len(context.strip()) < 50:
    print("\n⚠️ 文脈が短すぎます。")
    exit()

# ========================
# 🔹 9. プロンプト作成
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
# 🔹 10. トークン制限でプロンプトを調整
# ========================
inputs = tokenizer(prompt, truncation=True, max_length=1000, return_tensors="pt")
trimmed_prompt = tokenizer.decode(inputs["input_ids"][0])

# ========================
# 🔹 11. 回答生成（安定設定）
# ========================
result = language_model(
    trimmed_prompt,
    max_new_tokens=100,
    do_sample=False,
    pad_token_id=50256
)[0]['generated_text']

# # ========================
# # 🔹 12. デバッグ出力（任意）
# DEBUG = True
# if DEBUG:
#     print("\n--- 🔍 Debug info ---")
#     for i, (text, score) in enumerate(retrieved):
#         print(f"{i+1}. ({score:.4f}) {text[:60]}...")

# # ========================
# # 🔹 13. 出力
# # ========================
# print("\n💡 回答:")
# print(result)

# ========================
# 🔹 12. 応答クリーンアップ（崩壊対策）
# ========================
# プロンプト部分を除去
generated_raw = result.replace(trimmed_prompt, "").strip()

# 「答え：」以降だけ抽出
if "答え：" in generated_raw:
    generated_clean = generated_raw.split("答え：")[-1].strip()
else:
    generated_clean = generated_raw

# 不自然な記号・繰り返しを整理
generated_clean = re.sub(r"[：:\.]{3,}", "。", generated_clean)
generated_clean = re.sub(r"。+", "。", generated_clean).strip()

# 最低限の文字数を満たさない場合はフォールバック
if len(generated_clean) < 5:
    generated_clean = generated_raw.split("。")[0] + "。"

# ========================
# 🔹 13. デバッグ出力（オプション）
# ========================
DEBUG = True
if DEBUG:
    print("\n--- 🔍 Debug info ---")
    for i, (text, score) in enumerate(retrieved):
        print(f"{i+1}. ({score:.4f}) {text[:60]}...")

# ========================
# 🔹 14. 最終出力
# ========================
print("\n💡 回答:")
print(generated_clean)
