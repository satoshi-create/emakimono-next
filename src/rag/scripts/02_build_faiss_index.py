# 02_build_faiss_index.py
# FAISSインデックスを構築し、.index + id_map.jsonとして保存
from utils import load_jsonl_embeddings
import os, json
import faiss

# 入力ファイル
jsonl_path = os.path.join("..", "data/embeddings", "kou_with_embeddings.jsonl")
# 出力パス
index_path = os.path.join("..", "output", "faiss.index")
id_map_path = os.path.join("..", "output", "id_map.json")

# ベクトル読み込み
ids, texts, vectors = load_jsonl_embeddings(jsonl_path)

# インデックス構築
# FAISSのインデックスをユークリッド距離（L2）で構築
index = faiss.IndexFlatL2(vectors.shape[1])
index.add(vectors)
# インデックス保存
faiss.write_index(index, index_path)

# ID→テキストのマップ保存
with open(id_map_path, "w", encoding="utf-8") as f:
    json.dump({"ids": ids, "texts": texts}, f, ensure_ascii=False, indent=2)

print(f"✅ FAISS index saved to: {index_path}")
print(f"✅ ID map saved to: {id_map_path}")
