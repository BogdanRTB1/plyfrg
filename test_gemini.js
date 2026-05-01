require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { maxOutputTokens: 16384 } });
  
  try {
    console.log("Testing gemini-2.5-flash...");
    const res = await model.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 2.5-flash:", e.message);
  }

  const modelPro = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { maxOutputTokens: 16384 } });
  try {
    console.log("Testing gemini-2.5-pro...");
    const res = await modelPro.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 2.5-pro:", e.message);
  }
}

run();
