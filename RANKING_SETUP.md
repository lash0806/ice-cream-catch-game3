# ランキング機能セットアップガイド

## 概要
Google Apps ScriptとGoogleスプレッドシートを使用してランキング機能を実装します。

## セットアップ手順

### 1. Googleスプレッドシートの作成
1. [Google Sheets](https://sheets.google.com)で新しいスプレッドシートを作成
2. シート名を「ランキング」に変更
3. スプレッドシートのURLからIDを取得
   - URL例：`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - `SPREADSHEET_ID`の部分をコピー

### 2. Google Apps Scriptの設定
1. [Google Apps Script](https://script.google.com)で新しいプロジェクトを作成
2. `ranking-gas.js`の内容をコピー&ペースト
3. `SPREADSHEET_ID`を実際のIDに置き換え
4. コードを保存

### 3. Apps Scriptの初期化
1. Apps Scriptエディタで「実行」→「initializeSheet」を選択して実行
2. 権限の許可を求められた場合は許可する
3. スプレッドシートにヘッダー行（ニックネーム、スコア）が追加されることを確認

### 4. ウェブアプリとしてデプロイ
1. Apps Scriptエディタで「デプロイ」→「新しいデプロイ」をクリック
2. 種類で「ウェブアプリ」を選択
3. 設定：
   - 実行者：「自分」
   - アクセスできるユーザー：「全員」
4. 「デプロイ」をクリック
5. 表示されるウェブアプリURLをコピー
   - URL例：`https://script.google.com/macros/s/SCRIPT_ID/exec`

### 5. ゲーム側の設定
1. `script.js`の103行目を編集：
   ```javascript
   const RANKING_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
   `YOUR_SCRIPT_ID`を実際のスクリプトIDに置き換え

## 機能説明

### ランキング登録
- ゲーム終了時にニックネーム（10文字まで）を入力
- 「スコアを登録」ボタンでGoogleスプレッドシートに送信
- 一度登録すると、そのゲームセッションでは再登録できません

### ランキング表示
- 「ランキングを見る」ボタンでTOP10を表示
- スコア順（降順）で表示
- 1〜3位には🥇🥈🥉のメダル表示

## トラブルシューティング

### よくあるエラー
1. **通信エラー**
   - Apps ScriptのURLが正しく設定されているか確認
   - Apps Scriptが正しくデプロイされているか確認

2. **権限エラー**
   - Apps Scriptでスプレッドシートへのアクセス権限を確認
   - デプロイ時の設定で「全員」がアクセスできるようになっているか確認

3. **データが表示されない**
   - スプレッドシートに正しくデータが書き込まれているか確認
   - ヘッダー行が正しく設定されているか確認

### デバッグ方法
1. ブラウザの開発者ツール（F12）でコンソールエラーを確認
2. Apps Scriptの実行ログを確認
3. スプレッドシートに直接データが書き込まれているか確認

## 注意事項
- Google Apps Scriptには1日の実行回数制限があります
- 大量のアクセスがある場合は制限に達する可能性があります
- セキュリティ上、重要な情報は保存しないでください