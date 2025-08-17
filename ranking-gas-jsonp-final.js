// Google Apps Script用ランキングAPIコード（JSONP完全対応版）
const SPREADSHEET_ID = '14_dEFO_IJ0QL3-ELuw1ZuLorNJGrRGnE619pKOD2NBg'; // スプレッドシートのIDに置き換えてください
const SHEET_NAME = 'ランキング';

// GET リクエストですべてを処理（JSONP対応）
function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    if (action === 'submit') {
      // スコア送信処理
      const nickname = e.parameter.nickname;
      const score = parseInt(e.parameter.score);
      
      // バリデーション
      if (!nickname || !score) {
        const result = { success: false, error: 'ニックネームとスコアが必要です' };
        return createJSONPResponse(result, callback);
      }
      
      if (nickname.length > 10) {
        const result = { success: false, error: 'ニックネームは10文字以内で入力してください' };
        return createJSONPResponse(result, callback);
      }
      
      // submitScore関数を呼び出し
      const submitResult = submitScore(nickname, score);
      
      const result = { success: true, message: submitResult.message };
      return createJSONPResponse(result, callback);
        
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
      
      const result = { success: true, rankings: top10 };
      return createJSONPResponse(result, callback);
    }
    
  } catch (error) {
    const result = { success: false, error: error.toString() };
    const callback = e.parameter.callback;
    return createJSONPResponse(result, callback);
  }
}

// スコア送信・更新処理
function submitScore(nickname, score) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  let updated = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === nickname) {
      if (score > data[i][1]) {
        sheet.getRange(i + 1, 2).setValue(score); // スコア更新
        updated = true;
        return { message: "スコアを更新しました！" };
      } else {
        return { message: "前回より低いため更新されませんでした。" };
      }
    }
  }

  // 新規ユーザーなら追加
  sheet.appendRow([nickname, score]);
  return { message: "スコアが登録されました！" };
}

// JSONP レスポンス作成関数
function createJSONPResponse(data, callback) {
  if (callback) {
    // JSONPレスポンス
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSONレスポンス
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
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