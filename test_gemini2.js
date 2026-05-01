require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const modelPro15 = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { maxOutputTokens: 8192 } });
  
  try {
    console.log("Testing gemini-1.5-pro...");
    const res = await modelPro15.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 1.5-pro:", e.message);
  }

  const modelFlash15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { maxOutputTokens: 8192 } });
  try {
    console.log("Testing gemini-1.5-flash...");
    const res = await modelFlash15.generateContent("Say hello");
    console.log("Result:", res.response.text());
  } catch (e) {
    console.error("Error 1.5-flash:", e.message);
  }
}

run();
