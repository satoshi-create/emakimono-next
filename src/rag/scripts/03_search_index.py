# 03_search_index.py
# インデックス読み込み後、任意のクエリベクトルで類似検索
import faiss
import numpy as np
import os, json

# 入力
index_path = os.path.join("..", "data/embeddings", "faiss.index")
id_map_path = os.path.join("..", "data/embeddings", "id_map.json")

# クエリベクトル（ここでは仮に最初のベクトルを使う）
from utils import load_jsonl_embeddings

# サンプルクエリ：1つ目のベクトルを使う場合（ベクトル数＝index.ntotal）
query_vectors = load_jsonl_embeddings(os.path.join("..", "data/embeddings", "kou_with_embeddings.jsonl"))[2][0:1]



# FAISS読み込み
index = faiss.read_index(index_path)
# 類似検索：Top-3を取得
D, I = index.search(query_vectors, k=3)

# 結果表示
with open(id_map_path, encoding="utf-8") as f:
    id_map = json.load(f)

print("🔍 Top 5 most similar entries:")
for idx in I[0]:
    print(f" - ID: {id_map['ids'][idx]}")
    print(f"   TEXT: {id_map['texts'][idx][:100]}...\n")
