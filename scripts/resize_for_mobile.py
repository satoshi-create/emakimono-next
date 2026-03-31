import os
from PIL import Image

def resize_for_mobile(directory, target_width=375, quality=70):
    # ディレクトリが存在するか確認
    if not os.path.exists(directory):
        print(f"Error: {directory} が見つかりません。")
        return

    # サポートする拡張子
    extensions = (".jpg", ".jpeg")

    print(f"--- リサイズ処理を開始します (横幅: {target_width}px, 画質: {quality}%) ---")

    for filename in os.listdir(directory):
        if filename.lower().endswith(extensions):
            file_path = os.path.join(directory, filename)

            # 画像を開く
            with Image.open(file_path) as img:
                original_width, original_height = img.size

                # リサイズが必要か判断
                if original_width > target_width:
                    # アスペクト比を維持して新しい高さを計算
                    ratio = target_width / original_width
                    target_height = int(original_height * ratio)

                    # リサイズ実行 (高品質な LANCZOS フィルタを使用)
                    resized_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

                    # 元のサイズを表示（デバッグ用）
                    old_size = os.path.getsize(file_path)

                    # 低画質で保存 (optimize=True でさらに最適化)
                    resized_img.save(file_path, "JPEG", quality=quality, optimize=True)

                    new_size = os.path.getsize(file_path)
                    reduction = (old_size - new_size) / old_size * 100

                    print(f"Done: {filename} | {original_width}x{original_height} -> {target_width}x{target_height} | {old_size//1024}KB -> {new_size//1024}KB ({reduction:.1f}% 削減)")
                else:
                    print(f"Skip: {filename} | 横幅が {target_width}px 以下のためリサイズしません。")

    print("--- すべての処理が完了しました ---")

# 実行
target_dir = "../../public/images/kusouzu-honolulu"
resize_for_mobile(target_dir, target_width=375, quality=70)
