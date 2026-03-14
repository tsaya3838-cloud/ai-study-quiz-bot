/**
 * AI学習クイズBot
 * * スプレッドシートの学習ログからOpenAIがクイズを自動生成し、
 * LINE Messaging APIを通じて出題するシステムです。
 */

// 機密情報（GitHub公開時は伏せ字にします）
const LINE_ACCESS_TOKEN = 'YOUR_LINE_ACCESS_TOKEN'; 
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';     
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';     

function doPost(e) {
  const event = JSON.parse(e.postData.contents).events[0];
  const replyToken = event.replyToken;
  const userMessage = event.message.text;

  if (userMessage === 'クイズ') {
    const quiz = generateQuizFromSheet();
    sendLineMessage(replyToken, quiz);
  }
}

function generateQuizFromSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0 || data[0][0] === "") return "学習ログが見つかりませんでした。";

  const randomIndex = Math.floor(Math.random() * data.length);
  const selectedLog = data[randomIndex][0];

  const prompt = `以下の学習ログを元に、4択クイズを1問作成してください。
学習ログ: ${selectedLog}
出力形式:
問題: [問題文]
A. [選択肢]
B. [選択肢]
C. [選択肢]
D. [選択肢]
正解: [A-D]`;

  const payload = {
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": prompt}]
  };

  const options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  const json = JSON.parse(response.getContentText());

  if (json.error) return "AI連携エラーが発生しました。";
  return json.choices[0].message.content;
}

function sendLineMessage(token, text) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      replyToken: token,
      messages: [{type: 'text', text: text}]
    })
  });
}
