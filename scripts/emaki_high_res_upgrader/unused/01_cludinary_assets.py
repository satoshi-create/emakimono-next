import os
import json
import cloudinary
import cloudinary.api
from dotenv import load_dotenv
from pathlib import Path

# 「.venv」という名前の仮想環境を作成
# python -m venv .venv
# source .venv/bin/activate

# 1. 環境変数の読み込み
repo_root_for_env = Path(__file__).resolve().parent.parent
load_dotenv(repo_root_for_env / ".env.local")
load_dotenv(repo_root_for_env / ".env")


cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

def fetch_filtered_resources():
    print("🔍 ターゲット（ルート & emakimonoフォルダ）の資産を抽出中...")
    filtered_resources = []
    next_cursor = None

    try:
        while True:
            # max_resultsを500に設定して効率的に取得
            result = cloudinary.api.resources(
                type = "upload",
                max_results = 500,
                next_cursor = next_cursor
            )

            resources = result.get("resources", [])

            for res in resources:
                # フィルタリングロジック
                # folder属性が空文字 '' または None ならルート（home）
                folder = res.get("folder", "")

                if folder == "" or folder == "emakimono":
                    filtered_resources.append(res)

            next_cursor = result.get("next_cursor")
            if not next_cursor:
                break

        # 抽出結果を保存
        with open("cloudinary_assets_filtered.json", "w", encoding="utf-8") as f:
            json.dump(filtered_resources, f, indent=2, ensure_ascii=False)

        print(f"✅ フィルタリング完了: {len(filtered_resources)} 件のアイテムを保存しました。")
        print(f"📁 内訳:")
        print(f"   - ルート(home): {len([r for r in filtered_resources if r.get('folder') == ''])} 件")
        print(f"   - emakimono: {len([r for r in filtered_resources if r.get('folder') == 'emakimono'])} 件")

    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")

if __name__ == "__main__":
    fetch_filtered_resources()
