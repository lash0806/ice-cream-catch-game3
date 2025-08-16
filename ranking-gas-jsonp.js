// Google Apps Script用ランキングAPIコード（JSONP対応版）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // スプレッドシートのIDに置き換えてください
const SHEET_NAME = 'ランキング';

// GET リクエスト処理（ランキング取得）
function doGet(e) {
  try {
    const callback = e.parameter.callback; // JSONPのコールバック関数名
    const action = e.parameter.action;
    
    if (action === 'submit') {
      // スコア送信
      const nickname = e.parameter.nickname;
      const score = parseInt(e.parameter.score);
      
      if (!nickname || !score) {
        const result = { success: false, error: 'ニックネームとスコアが必要です' };
        return ContentService
          .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      
      if (nickname.length > 10) {
        const result = { success: false, error: 'ニックネームは10文字以内で入力してください' };
        return ContentService
          .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      sheet.appendRow([nickname, score]);
      
      const result = { success: true, message: 'スコアが正常に登録されました' };
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
        
    } else {
      // ランキング取得
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      const rankings = data.slice(1).map(row => ({
        nickname: row[0],
        score: row[1]
      }));
      
      rankings.sort((a, b) => b.score - a.score);
      const top10 = rankings.slice(0, 10);
      
      const result = { success: true, rankings: top10 };
      
      if (callback) {
        return ContentService
          .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
  } catch (error) {
    const result = { success: false, error: error.toString() };
    const callback = e.parameter.callback;
    
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// テスト用関数：スプレッドシートの初期化
function initializeSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.getRange(1, 1, 1, 2).setValues([['ニックネーム', 'スコア']]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f0f0f0');
    console.log('シートの初期化が完了しました');
  } catch (error) {
    console.error('シートの初期化に失敗しました:', error);
  }
}