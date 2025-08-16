// Google Apps Script用ランキングAPIコード（GET方式・CORS完全対応版）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // スプレッドシートのIDに置き換えてください
const SHEET_NAME = 'ランキング';

// GET リクエストですべてを処理
function doGet(e) {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    const action = e.parameter.action;
    
    if (action === 'submit') {
      // スコア送信処理
      const nickname = e.parameter.nickname;
      const score = parseInt(e.parameter.score);
      
      // バリデーション
      if (!nickname || !score) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'ニックネームとスコアが必要です' }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders(headers);
      }
      
      if (nickname.length > 10) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'ニックネームは10文字以内で入力してください' }))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders(headers);
      }
      
      // スプレッドシートを開く
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      
      // 新しい行を追加
      sheet.appendRow([nickname, score]);
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'スコアが正常に登録されました' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
        
    } else {
      // ランキング取得処理
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
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, rankings: top10 }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
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