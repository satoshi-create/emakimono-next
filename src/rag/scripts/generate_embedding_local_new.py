import json
from sentence_transformers import SentenceTransformer
from transformers import GPT2Tokenizer

# ✅ 事前にダウンロードが必要なモデルを読み込み
# 埋め込み用の軽量モデル（MiniLM）を使う
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# トークン数計測のために、GPT2のトークナイザーを使用
tokenizer = GPT2Tokenizer.from_pretrained("distilgpt2")

# ✅ 入力：センテンス分割＋メタ情報のみのファイル（前ステップで生成）
input_file = "../data/jsonl/kou_split_metadata.jsonl"

# ✅ 出力：embeddingとtoken数を付加した完全なRAG入力形式
output_file = "kou_embedding_ready.jsonl_sentences.jsonl"

# 各行に対して処理を実行
with open(input_file, "r", encoding="utf-8") as fin, \
     open(output_file, "w", encoding="utf-8") as fout:

    for line in fin:
        item = json.loads(line)  # JSON形式で読み込み

        # 🔹 Step 1: トークン数の計測（promptの長さ調整用）
        item["tokens"] = len(tokenizer.encode(item["text"]))

        # 🔹 Step 2: SentenceTransformerでベクトル化（384次元）
        item["embedding"] = embedder.encode(item["text"]).tolist()

        # 🔹 Step 3: 新しいレコードを書き出し
        fout.write(json.dumps(item, ensure_ascii=False) + "\n")

print("✅ kou_with_embeddings_sentences.jsonl を生成しました。")
