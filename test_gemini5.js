require('dotenv').config({ path: '.env.local' });

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Available models:", data.models.map(m => m.name));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
