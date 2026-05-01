require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const modelFlashLatest = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { maxOutputTokens: 8192 } });
  
  try {
    console.log("Testing gemini-flash-latest...");
    const res = await modelFlashLatest.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error flash-latest:", e.message);
  }

  const modelProLatest = genAI.getGenerativeModel({ model: "gemini-pro-latest", generationConfig: { maxOutputTokens: 8192 } });
  try {
    console.log("Testing gemini-pro-latest...");
    const res = await modelProLatest.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error pro-latest:", e.message);
  }
}

run();
