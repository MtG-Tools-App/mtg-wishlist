# MtG Wishlist

Magic: The Gathering ウィッシュリスト & 価格トラッカー PWA

## 概要

- ウィッシュリストにカードを登録し、目標価格・優先度・フォーマットを管理
- Scryfall API でカードを検索して追加（日本語名対応）
- 購入価格ログを記録し、在庫状況を3段階で表示（通常 / 売り切れ / 未確認）
- PWA 対応（ホーム画面に追加可能）

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB (開発) | better-sqlite3 |
| DB (本番) | Turso (@libsql/client) |
| バリデーション | Zod v4 |
| PWA | next-pwa v5 (Workbox) |

## セットアップ

```bash
npm install
npm run db:init      # SQLite DB 初期化 (data/wishlist.db)
npm run db:seed      # デモデータ投入 (任意)
npm run dev          # 開発サーバー起動 http://localhost:3000
```

## 主要 npm scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 (webpack モード) |
| `npm run build` | 本番ビルド + SW 生成 |
| `npm run start` | 本番サーバー起動 |
| `npm run db:init` | DB スキーマ初期化 |
| `npm run db:seed` | デモデータ投入 |
| `npm run test:scryfall` | Scryfall クライアント動作確認 |

## 環境変数

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | Turso 接続 URL（未設定時は SQLite ローカル DB を使用） |
| `TURSO_AUTH_TOKEN` | Turso 認証トークン |
