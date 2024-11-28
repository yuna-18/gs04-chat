import { GoogleGenerativeAI } from "@google/generative-ai";
// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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
  <div class="ai-msg">
    <p>${aiMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}

function createUserMsg (userMsg) {
  let message = `
  <div class="user-msg">
    <p>${userMsg}</p>
  </div>
  `;
  $('.contents').append(message);
}



async function run() {
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  const prompt = "散歩の目的地を決めるための質問を5個までしてください。また、回答次第で散歩の目的地を決定してください。"

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
}

// run();