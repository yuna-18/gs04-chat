import {GoogleGenerativeAI} from "@google/generative-ai";
// Access your API key as an environment variable (see "Set up your API key" above)

$('#send').on("click", function () {
  let userMsg = $('#userMsg').val();
  createUserMsg(userMsg);
  $('#userMsg').val("");
  // alert(userMsg);
});

$('#reset').on("click", function () {
  $('#userMsg').val("");
});

function createAIMsg (aiMsg) {
  let message = `
  <div class="ai-msg msg">
    <p>${aiMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}

function createUserMsg (userMsg) {
  let message = `
  <div class="user-msg msg">
    <p>${userMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}



async function initAiMsg () {
  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
    const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

    const prompt = "以下の条件に従って質問を行い、目的地を提案してください。1.質問は1つずつ順番に行い、3回までとする。2.メッセージには質問以外の内容を含めない。3.質問ごとに選択肢を提示し、選択肢には番号をつける。4.質問は回答に応じて次の質問を変化させる。5.すべての質問が終わった後、回答に基づいて適切な散歩の目的地を1つ提案する。6.提案する目的地は具体名を避け、カテゴリ（例：公園、史跡）で表現すること。7.pタグで囲むのを前提として、適宜改行タグを含めて出力すること。8.選択肢の前には1行空の行を含めること。";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    createAIMsg(text);

  } catch (error) {
    console.error("!!!Error!!!", error);
  }

}

initAiMsg();