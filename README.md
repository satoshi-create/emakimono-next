# 🎨 横スクロールで楽しむ絵巻物 - Open Source Project

## 📌 プロジェクト概要
このプロジェクトは、日本の伝統的な絵巻物を **横スクロールで楽しめるデジタル体験** にするためのOSSプロジェクトです。Next.js をベースに開発されており、WebGL や画像最適化技術を活用して、美しくスムーズな閲覧体験を提供します。

## 🚀 デモ
[横スクロールで楽しむ絵巻物](https://emakimono.com/)

## 🏗 技術スタック
- **フロントエンド**: Next.js, React, CSS.Module
- **バックエンド**: Node.js
- **データ管理**: JSON
- **画像最適化**: WebP, Image Optimization


## 📥 セットアップ方法

### ✅ 前提条件
- Node.js（推奨: v18 以上）
- Git LFS（画像取得用）

### 1. Git LFS をインストール & クローン
このプロジェクトでは画像ファイルの管理に Git LFS を使用しています。

```sh
git lfs install
git clone https://github.com/your-username/emaki-scroll.git
cd emaki-scroll
git lfs pull
```

### 2. 環境変数ファイル（.env.local）の作成
`.env.local` ファイルをプロジェクトのルートに作成し、以下のように記述してください：

```env
NEXT_PUBLIC_CLOUDINARY_URL=your-cloudinary-url
NEXT_PUBLIC_API_KEY=your-api-key
```

※ `.env.example` も参考にしてください。

### 3. 依存関係をインストール（Next.js 12 対応）
```sh
npm install --legacy-peer-deps  # または yarn install --legacy-peer-deps
```

### 4. 開発サーバーを起動
```sh
npm run dev  # または yarn dev
```

ローカル環境で `http://localhost:3000` にアクセスできます。

## 📌 貢献方法
### コントリビューションの流れ
1. Issue を確認し、自分ができそうなものを選ぶ
2. `feature/your-feature-name` のブランチを作成
3. 修正を加えて PR（プルリクエスト）を作成
4. レビューを受けて修正
5. `main` ブランチにマージ！ 🎉

### Good First Issues
初心者向けのタスクを用意しています！
- [Good First Issues を探す](https://github.com/satoshi-create/emakimono-next/issues)

## 📝 ライセンス
このプロジェクトは **MITライセンス** のもとで公開されています。自由に利用・改変可能です。

## 🌟 スターをつけて応援！
このプロジェクトが気に入ったら、GitHub のスターをつけて応援してください！ ⭐️

---
📩 **開発者・コントリビューター募集中！**
興味がある方は、Issue または [Discussions](https://github.com/satoshi-create/emakimono-next/discussions) でご連絡ください！

