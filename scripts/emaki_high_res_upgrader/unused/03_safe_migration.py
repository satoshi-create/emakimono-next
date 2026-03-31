import os
import json
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from pathlib import Path
# 1. 環境変数の読み込み
repo_root_for_env = Path(__file__).resolve().parent.parent
load_dotenv(repo_root_for_env / ".env.local")
load_dotenv(repo_root_for_env / ".env")

# 設定の取得
cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')

cloudinary.config(
    cloud_name = cloud_name,
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

def execute_safe_overwriting():
    try:
        with open("mapping_list.json", "r", encoding="utf-8") as f:
            mapping_list = json.load(f)
    except FileNotFoundError:
        print("❌ mapping_list.json が見つかりません。")
        return

    print(f"🛡️ リモートコピーモードで高画質化を開始... | 対象: {len(mapping_list)}件")

    results = {"success": [], "error": []}

    for item in mapping_list:
        source_id = item['source'] # 本番高画質 ID
        target_id = item['target'] # ダミーの住所 (emakimono/...)

        # 【重要】Public ID からフルURLを生成してソースにする
        source_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{source_id}"

        try:
            # Cloudinary上のURLを元に、新しいPublic IDへアップロード（コピー）
            cloudinary.uploader.upload(
                source_url,         # ローカルパスではなくURLを渡す
                public_id=target_id, # 上書き先の住所
                overwrite=True,
                invalidate=True,
                resource_type="image"
            )
            print(f"✅ 置換完了: {target_id}")
            results["success"].append(target_id)

        except Exception as e:
            print(f"❌ 失敗: {target_id} | 理由: {e}")
            results["error"].append({"target": target_id, "error": str(e)})

    with open("safe_migration_log.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✨ 処理が完了しました！")
    print(f"成功: {len(results['success'])} 件 / 失敗: {len(results['error'])} 件")

if __name__ == "__main__":
    execute_safe_overwriting()
