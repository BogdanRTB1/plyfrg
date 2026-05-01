require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const modelFlash20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { maxOutputTokens: 8192 } });
  
  try {
    console.log("Testing gemini-2.0-flash...");
    const res = await modelFlash20.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 2.0-flash:", e.message);
  }

  const modelPro20 = genAI.getGenerativeModel({ model: "gemini-2.0-pro", generationConfig: { maxOutputTokens: 8192 } });
  try {
    console.log("Testing gemini-2.0-pro...");
    const res = await modelPro20.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 2.0-pro:", e.message);
  }
}

run();
