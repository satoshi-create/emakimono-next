# 04_rag_chat.py
# ✅ OpenAI API不要・ローカルベースの簡易RAGシステム（改善版）

import faiss
import json
import os
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
# 🔹 4. ユーザー入力とクエリベクトル生成
# ========================
query = input("📥 質問をどうぞ：")
query_embedding = embedding_model.encode([query], convert_to_numpy=True).astype('float32')

# ========================
# 🔹 5. データとFAISSインデックスをロード
# ========================
entries, _ = load_jsonl_embeddings(os.path.join("..", "data/embeddings", "kou_embedding_ready.jsonl_sentences.jsonl"))
index = load_faiss_index(os.path.join("..", "data/embeddings", "faiss.index"))

# ========================
# 🔹 6. FAISS類似検索
# ========================
D, I = index.search(query_embedding, k=3)

# ========================
# 🔹 7. 類似度スコアによる判定（閾値を超えると無効）
SIMILARITY_THRESHOLD = 0.7  # cosine距離（小さいほど近い）
if D[0][0] > SIMILARITY_THRESHOLD:
    print("\n⚠️ 質問に関連する情報が見つかりませんでした。")
    exit()

print(f"🧪 最も近い距離スコア: {D[0][0]:.4f}")

# ========================
# 🔹 8. 検索結果の文脈生成とチェック
# ========================
retrieved_texts = [entries[i]['text'] for i in I[0]]
context = "\n\n".join(retrieved_texts)

if len(context.strip()) < 100:
    print("\n⚠️ 関連する十分な文脈が見つかりません。")
    exit()

# ========================
# 🔹 9. プロンプト作成（わからない時の応答も指定）
# ========================
prompt = f"""次の文脈に基づいて、質問に日本語で答えてください。
ただし、文脈に情報がない場合は「その件については文脈に情報がありません」とだけ答えてください。

文脈:
{context}

質問:
{query}

答え："""

# ========================
# 🔹 10. プロンプト長をトークン制限（1024未満）に調整
# ========================
MAX_TOKENS = 800
inputs = tokenizer(prompt, truncation=True, max_length=MAX_TOKENS, return_tensors="pt")
trimmed_prompt = tokenizer.decode(inputs["input_ids"][0])

# ========================
# 🔹 11. 回答生成
# ========================
result = language_model(trimmed_prompt, max_new_tokens=200, do_sample=False)[0]['generated_text']

# ========================
# 🔹 12. 出力
# ========================
print("\n💡 回答:")
print(result)
