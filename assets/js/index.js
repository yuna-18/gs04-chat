import {GoogleGenerativeAI} from "@google/generative-ai";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {ref, set, push, get}
  from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
// Access your API key as an environment variable (see "push up your API key" above)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
// The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
const prompt = `
    以下の条件に従って質問を行い、散歩の目的地を提案してください:
    ・質問と選択肢だけの文章を作る。
    ・質問ごとに小文字のアルファベットをつけた選択肢を表示する。
    ・選択肢の回答結果に応じて次の質問を考える。
    ・最終的にカテゴリ（例：公園、史跡）で提案する。
    ・選択肢同士の間に<br>タグを1つ入れる。
    ・選択肢の直前に<br>タグを2つ入れる。
    ・質問文に数字をつけない。
    ・一度のメッセージに質問は1つまで。
  `;
let step;
let messageId;
const sessions = {};

// 全体の流れ
$(function () {
  initMsg();
  // initMsg();
  // 送信ボタンクリック・エンターキー押した時の挙動
  $('#send').on("click", sendMsg);
  $("#userMsg").on("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // フォームのデフォルト送信動作を防ぐ
      sendMsg();
    }
  });
  // 入力中のテキストリセット
  $('#repush').on("click", function () {
    $('#userMsg').val("");
  });
})


// ---要素挿入---
// AIメッセージ要素作成
function createAIMsg (aiMsg) {
  let message = `
  <div class="ai-msg msg">
    <p>${aiMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}
// ユーザーメッセージ要素作成
function createUserMsg (userMsg) {
  let message = `
  <div class="user-msg msg">
    <p>${userMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}


// ---AIプロンプト---
// AI初期メッセージ
async function initMsg () {
  const result = await model.generateContent(prompt);
  const question = result.response.text();
  step = 1;
  const id = generateId();
  messageId = id;
  const sessionRef = ref(window.db, `sessions/step${step}-${messageId}`);
  const aiResponse = {
    text: question,
  }
  // 質問をデータベースに保存
  // saveToDatabase(aiResponse);
  if (!sessions[messageId]) {
    sessions[messageId] = {};
  }
  sessions[messageId].id = `step${step}-${messageId}`;
  sessions[messageId].aiResponse = aiResponse.text;
  set(sessionRef, sessions[messageId]);
  createAIMsg(question);
  
  return id;
}

// AIからの返信
async function replyAiMsg (userMsg) {
  step += 1;
  const history = await fetchSessionHistory(); // Firebaseから履歴を取得する関数を実装
  const replyPrompt = `
    以下は現在の会話の履歴です: ${history}
    ユーザーの最新回答: ${userMsg}
    この情報をもとに、次の質問を生成してください。
    ${prompt}
  `;
  const sessionRef = ref(window.db, `sessions/step${step}-${messageId}`);
  const result = await model.generateContent(replyPrompt);
  const nextQuestion = result.response.text();
  const aiResponse = {
    text: nextQuestion,
  }
  // 次の質問を保存
  // saveToDatabase(aiResponse);
  sessions[messageId].aiResponse = aiResponse.text;
  set(sessionRef, sessions[messageId]);
  // AIの返信を画面に表示
  createAIMsg(nextQuestion);
}

// 目的地の提案
async function lastAiMsg () {
  const history = await fetchSessionHistory(); // Firebaseから履歴を取得
  const lastPrompt = `
    会話履歴:
    ${history}
    上記の情報を基に、適切な散歩の目的地をカテゴリで提案してください。
    （例: 公園、史跡）
  `;
  const sessionRef = ref(window.db, `sessions/step${step}-${messageId}`);
  const result = await model.generateContent(lastPrompt);
  const destination = result.response.text();
  const aiResponse = {
    result: destination,
  }
  set(sessionRef, sessions[messageId]);
  // displayMessage(`提案された散歩の目的地: ${destination}`);
}

// ---その他の関数---
// 会話履歴取得
async function fetchSessionHistory () {
  const sessionRef = ref(window.db, `sessions/${messageId}`);
  const snapshot = await get(sessionRef);

  if (snapshot.exists()) {
    const history = snapshot.val();
    return history;
  } else {
    console.log("No chat history found.");
    return null;
  }
}

// 送信
function sendMsg () {
  let userMsg = $('#userMsg').val();
  createUserMsg(userMsg);
  const sessionRef = ref(window.db, `sessions/step${step}-${messageId}`);
  $('#userMsg').val("");
  const userResponse = {
    // id: `${messageId}`,
    text: userMsg,
  }
  // set(sessionRef, userResponse.userResponse);
  console.log(messageId);
  // saveToDatabase(userResponse);
  if (!sessions[messageId]) {
    sessions[messageId] = {};
  }
  sessions[messageId].userResponse = userResponse.text;
  console.log(sessions[messageId]);
  set(sessionRef, sessions[messageId]);

  if (step < 4) {
    setTimeout(() => {
      replyAiMsg(userMsg);
    }, 1000);
  }
}

// データベースに保存
// function saveToDatabase (message) {
//   const messageRef = ref(window.db, `sessions/${message.id}`);
//   set(messageRef, message);
// }

// ID生成
function generateId () {
  return Math.floor(Math.random() * 1000 + 1)
}

// ID取得
async function main() {
  const id = await initMsg();
  console.log(id);
}