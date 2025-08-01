# === 必要なライブラリの読み込み ===
from openai import OpenAI
from dotenv import load_dotenv
import faiss, json, os, numpy as np
from sentence_transformers import SentenceTransformer

# === 1. .envファイルからAPIキーを読み込む ===
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# OpenAIのクライアントを初期化
client = OpenAI(api_key=api_key)

# === 2. 質問をベクトル検索できるように埋め込みモデルをロード ===
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# === 3. JSONLファイルから文データとベクトルを読み込む関数 ===
def load_jsonl_embeddings(path):
    entries, vectors = [], []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            obj = json.loads(line)
            entries.append(obj)  # テキスト情報（text, tokens, metadataなど）
            vectors.append(np.array(obj['embedding'], dtype='float32'))  # ベクトル情報
    return entries, np.vstack(vectors)  # → ([text情報リスト], [ベクトルの2次元配列])

# === 4. FAISSインデックスを読み込む関数 ===
def load_faiss_index(index_path):
    return faiss.read_index(index_path)

# === 5. ユーザーから質問を受け取る ===
query = input("📥 質問をどうぞ：")

# 質問文をベクトル化（意味的に検索できるようにする）
query_embedding = embedding_model.encode([query], convert_to_numpy=True).astype('float32')

# === 6. 埋め込みデータとインデックスの読み込み ===
entries, _ = load_jsonl_embeddings("../data/embeddings/kou_embedding_ready.jsonl_sentences.jsonl")
index = load_faiss_index("../data/embeddings/faiss.index")

# === 7. FAISSを使って意味的に近い文を検索 ===
D, I = index.search(query_embedding, k=5)  # 上位5件を取得
retrieved = [entries[idx]['text'] for idx in I[0] if D[0][list(I[0]).index(idx)] > 0.5]

# === 🐛 Debug表示：上位5件の類似文とスコア ===
print("\n--- 🔍 類似文コンテキスト（Top 5） ---")
for rank, (idx, score) in enumerate(zip(I[0], D[0])):
    text = entries[idx]['text']
    print(f"{rank + 1}. ({score:.4f}) {text[:80]}{'...' if len(text) > 80 else ''}")

# === 8. 検索された文から文脈を構築（ChatGPTへのプロンプトに使う） ===
context = "\n\n".join(retrieved)

# === 9. ChatGPT APIに渡すプロンプトを構成 ===
messages = [
    {"role": "system", "content": "あなたは鳥獣戯画・甲巻の専門AIです。文脈に基づいて質問に答えてください。"},
    {"role": "user", "content": f"文脈:\n{context}\n\n質問:\n{query}\n\n回答をお願いします。"}
]

# === 10. OpenAI APIに質問を送信し、回答を生成 ===
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=messages,
    temperature=0.7,
    max_tokens=200
)


# === 11. ChatGPTの回答を表示 ===
print("\n💡 回答:")
print(response.choices[0].message.content)
