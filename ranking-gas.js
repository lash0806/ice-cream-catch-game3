// Google Apps Script用ランキングAPIコード
// Google スプレッドシートのURLまたはIDを設定してください
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // スプレッドシートのIDに置き換えてください
const SHEET_NAME = 'ランキング'; // シート名

// CORS対応のヘルパー関数
function createCORSResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// OPTIONSリクエスト（プリフライト）への対応
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// ランキングデータを受信（スコア送信）
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { nickname, score } = data;
    
    // バリデーション
    if (!nickname || score === undefined) {
      return createCORSResponse({ success: false, error: 'ニックネームとスコアが必要です' });
    }
    
    // ニックネームの長さチェック（10文字まで）
    if (nickname.length > 10) {
      return createCORSResponse({ success: false, error: 'ニックネームは10文字以内で入力してください' });
    }
    
    // スプレッドシートを開く
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // 新しい行を追加
    sheet.appendRow([nickname, parseInt(score)]);
    
    return createCORSResponse({ success: true, message: 'スコアが正常に登録されました' });
      
  } catch (error) {
    return createCORSResponse({ success: false, error: error.toString() });
  }
}

// ランキングデータを取得
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行を除く
    const rankings = data.slice(1).map(row => ({
      nickname: row[0],
      score: row[1]
    }));
    
    // スコア順でソート（降順）
    rankings.sort((a, b) => b.score - a.score);
    
    // TOP10を取得
    const top10 = rankings.slice(0, 10);
    
    return createCORSResponse({ success: true, rankings: top10 });
      
  } catch (error) {
    return createCORSResponse({ success: false, error: error.toString() });
  }
}

// テスト用関数：スプレッドシートの初期化
function initializeSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    // ヘッダー行を設定
    sheet.getRange(1, 1, 1, 2).setValues([['ニックネーム', 'スコア']]);
    
    // ヘッダー行のスタイル設定
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f0f0f0');
    
    console.log('シートの初期化が完了しました');
  } catch (error) {
    console.error('シートの初期化に失敗しました:', error);
  }
}

/*
=== セットアップ手順 ===

1. Google Apps Scriptの新しいプロジェクトを作成
   https://script.google.com/

2. 上記のコードをコピー&ペースト

3. Googleスプレッドシートを作成し、スプレッドシートのIDを取得
   - スプレッドシートのURLから、例：https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   - SPREADSHEET_IDの部分をコピー

4. コード内のSPREADSHEET_IDを実際のIDに置き換え

5. Apps Scriptエディタで「デプロイ」→「新しいデプロイ」
   - 種類：「ウェブアプリ」
   - 実行者：「自分」
   - アクセスできるユーザー：「全員」
   - デプロイ

6. デプロイ後に表示されるウェブアプリURLをコピー
   例：https://script.google.com/macros/s/SCRIPT_ID/exec

7. ゲーム側のコードでこのURLを使用

8. initializeSheet()関数を一度実行してシートを初期化
*/