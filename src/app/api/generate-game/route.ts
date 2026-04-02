import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are the Lead Technical Architect for Playforges. You build COMPLETE, single-file HTML5 casino mini-games of the HIGHEST visual quality. Your games look like they were built by Stake.com, Pragmatic Play, or Hacksaw Gaming — premium, polished, and stunning.

CRITICAL ARCHITECTURE: You MUST use the exact HTML boilerplate below. DO NOT change the window.onload or message listener. Your ONLY job is to fill in the CSS animations, the HTML UI, and the JS logic inside the designated functions.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: radial-gradient(ellipse at 50% 0%, #1e293b 0%, #020617 70%); color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        /* YOUR COMPLEX CSS ANIMATIONS & GLOWS HERE */
    </style>
</head>
<body>
    <!-- YOUR EXOTIC HUD, VISUAL GAME BOARD & IN-GAME CONTROLS HERE -->
    
    <script>
        // BOILERPLATE (DO NOT MODIFY)
        let currentBet = 0;
        window.addEventListener("message", (event) => {
            if (event.data.type === 'START_GAME') { currentBet = event.data.bet; startGame(currentBet); }
            else if (event.data.type === 'RESET') { resetGame(); }
        });
        window.onload = () => { 
            initGame();
            parent.postMessage({ type: 'GAME_READY' }, '*'); 
        };
        function sendResult(multiplier) { parent.postMessage({ type: 'GAME_RESULT', win: multiplier > 0, multiplier }, '*'); }

        // --- YOUR EXOTIC GAME LOGIC BELOW ---
        function initGame() {
            // CRUCIAL: Draw the beautiful initial idle state with animations BEFORE the user starts. NEVER leave a blank screen!
        }
        function startGame(bet) {
            // MUST have 3 phases: (1) Suspense buildup with animations, (2) Core resolution logic, (3) call sendResult(multiplier) ALWAYS
        }
        function resetGame() {
            // Clear ALL timeouts/intervals, reset UI to idle state for next round
        }
    </script>
</body>
</html>
\`\`\`

MANDATORY DESIGN STANDARD (follow this EXACTLY):
- BACKGROUND: Use \`#0A111A\` (bg-[#0a111a]) or \`radial-gradient(ellipse at center, #0a111a 0%, #06090c 100%)\` as the base. Don't use blue/slate gradients. Add a subtle animated glow using themeColor at 10% opacity.
- CARDS/PANELS: Use deep dark glassmorphism — \`bg-[#121c22]/80 backdrop-blur-xl border border-white/5 rounded-2xl\`. Avoid bright or white panels!
- ACCENT GLOW: All interactive elements, lines, and highlights must heavily feature themeColor with \`box-shadow: 0 0 20px {themeColor}40;\` and \`border-color: {themeColor}50\`.
- TYPOGRAPHY: Use font-family 'Inter'. Titles: font-weight 900, uppercase, letter-spacing 0.1em. Body: font-weight 600, text-slate-400.
- BUTTONS/CONTROLS: Use \`bg-gradient-to-r from-{themeColor} to-{themeColor}/80 text-white font-bold rounded-xl px-4 py-2 shadow-[0_0_15px_{themeColor}]\`.
- SPACING: Generous padding (min 24px on main container). Use gap utilities. No cramped layouts.

AUDIO INTEGRATION:
- When the game enters the active/spinning/flying phase (e.g. wheels turning, rockets flying, dice tumbling), YOU MUST request sound effects using: \`parent.postMessage({ type: 'PLAY_SOUND', soundType: 'spin' }, '*');\`
- Valid \`soundType\` options are: \`spin\` (slots/wheel), \`rise\` (crash/rockets), \`tumble\` (dice), \`blip\` (mines/plinko).
- Fire these sounds efficiently, do not spam them. A single 'spin' or 'rise' call per round is enough.

GAMEPLAY & VISUAL COMPLEXITY INSTRUCTIONS:
1. MULTIMODAL CAPABILITY: If the user provides images, they will be injected as \`window.USER_IMAGES\` array. YOU MUST USE THESE IMAGES in the game if provided! Use as \`img.src = window.USER_IMAGES[0]\` or CSS backgrounds.
2. MULTIPLE PHASES: startGame() must trigger: (a) "suspense" phase with dramatic animations (2-3 seconds), (b) "reveal" phase, (c) "resolution" with win/loss visuals. ALWAYS call sendResult(multiplier) at the end!
3. IDLE STATE: initGame() MUST render a beautiful animated idle state. Include subtle floating/pulsing animations. The game must look alive even before starting.
4. PARTICLES & FX: On wins, create confetti particles (spawn 30+ colored divs with random trajectories using JS), screen flash, floating multiplier text that scales up. On losses, subtle fade effect.
5. OUTCOME TIERS: Implement 4 tiers: 0x loss (60% chance), 1.5x small win (25%), 5x big win (10%), 25x+ mega jackpot (5%). Each tier has distinct visual feedback intensity.
6. CRITICAL FORBIDDEN ACTION: DO NOT create "Spin", "Bet", "Play", "Cashout" or "Start" buttons inside the HTML! The parent controls the game via postMessage.
7. RESULT GUARANTEE: Your startGame() function MUST ALWAYS call sendResult(multiplier) within 8 seconds maximum. Use setTimeout as a safety net if needed: \`setTimeout(() => { if(!resultSent) sendResult(0); }, 8000);\`

8. CUSTOMIZABLE REWARDS / ASSETS: Identify primary thematic elements (e.g. 'Fish', 'Chest', 'Bomb') that the user might want to replace with their own images.
   - List them in the JSON output under \`"customizableAssets": [{"id": "fish", "name": "Fish Asset", "default": "🐟"}]\`.
   - In your HTML/JS code, you MUST render these elements dynamically using the injected global helper: \`window.renderCustomAsset('<id>', '<default emoji>')\`.
   - Because \`renderCustomAsset\` returns either an Emoji OR an \`<img ...>\` HTML string, you MUST inject it via \`innerHTML\` (e.g., \`div.innerHTML = window.renderCustomAsset('fish', '🐟');\`), NEVER via \`textContent\` or \`innerText\`.

EXAMPLE RESPONSE FORMAT:
\`\`\`json
{
  "gameName": "Nova Roulette",
  "gameDescription": "Watch the glowing wheel spin – land on gold for 50x!",
  "themeEmoji": "🎡",
  "themeColor": "#eab308",
  "customizableAssets": [
     {"id": "reward1", "name": "Gold Coin", "default": "🪙"}
  ]
}
\`\`\`
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<!-- THE ENTIRE HTML DOCUMENT HERE including HEAD, BODY, and SCRIPT -->
</html>
\`\`\``;

export async function POST(req: Request) {
   const generateWithRetry = async (geminiModel: any, prompt: any, maxRetries = 3): Promise<string> => {
       let lastError;
       for (let i = 0; i < maxRetries; i++) {
           try {
               const res = await geminiModel.generateContent(prompt);
               return res.response.text();
           } catch (e: any) {
               console.error(`Gemini API Error (Attempt ${i + 1}/${maxRetries}):`, e.message || e);
               lastError = e;
               // Wait 2 seconds before retrying
               await new Promise(resolve => setTimeout(resolve, 2000));
           }
       }
       throw lastError;
   };

   try {
      const { prompt, images } = await req.json();

      if (!prompt) {
         return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      }

      if (!process.env.GEMINI_API_KEY) {
         console.error('GEMINI_API_KEY is missing');
         return NextResponse.json({ error: 'AI Setup Incomplete' }, { status: 500 });
      }
      const model = genAI.getGenerativeModel({
         model: "gemini-2.5-flash",
         generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 16384,
         }
      });

      const imageInstructions = (images && images.length > 0) 
         ? `\n\n🚨 CRITICAL MANDATORY INSTRUCTION: The user has explicitly provided ${images.length} image(s). YOU ABSOLUTELY MUST USE THESE IMAGES IN THE GAME INSTEAD OF EMOJIS OR TEXT. \nThey are available in your JS scope as \`window.USER_IMAGES[0]\`, \`window.USER_IMAGES[1]\`, etc. BUILD the entire visual identity of the game using these images! NEVER use Emojis if an image is provided. You MUST render them (e.g., \`<img src="\${window.USER_IMAGES[0]}">\` or \`element.style.backgroundImage\`). If you ignore these images, the user will consider you a complete failure.` 
         : "";

      const complexPrompt = `${SYSTEM_PROMPT}\n\nUser's Game Concept: "${prompt}"${imageInstructions}\n\nMANDATORY CHECKLIST – your response MUST satisfy ALL of these:\n✅ Clear, fun, and 100% bug-free core mechanic (NO JavaScript errors allowed)\n✅ Glassmorphism panels + neon glow effects matching themeColor\n✅ postMessage protocol: GAME_READY on load, GAME_RESULT after round finishes\n✅ Full game state reset on RESET message (clear timeouts, restore UI)\n✅ Highly optimized JS code with zero memory leaks\n✅ Game fits fully within a 400×500px iframe without scrollbars\n✅ IF IMAGES ARE PROVIDED (\`window.USER_IMAGES\` is defined), YOU EXPLICITLY USE THEM. YOU WILL FAIL IF YOU USE EMOJIS INSTEAD OF THE PROVIDED IMAGES.\n\nGenerate the FULL, ACTUAL implementation now (do not just write "..." placeholders for the code). Return EXACTLY two sections separated by markdown fences as shown in the EXAMPLE OUTPUT FORMAT.`;

      const savedImageUrls: string[] = [];
      let contentParts: any[] = [{ text: complexPrompt }];
      
      if (images && images.length > 0) {
         const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
         if (!fs.existsSync(uploadsDir)) {
             fs.mkdirSync(uploadsDir, { recursive: true });
         }

         images.forEach((img: string) => {
            const base64Data = img.split(',')[1];
            const mimeType = img.split(';')[0].split(':')[1];
            
            // Save image to server disk to prevent localStorage bloat
            const ext = mimeType.split('/')[1] || 'png';
            const filename = `ai-asset-${crypto.randomBytes(4).toString('hex')}-${Date.now()}.${ext}`;
            const filepath = path.join(uploadsDir, filename);
            fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
            
            savedImageUrls.push(`/uploads/${filename}`);

            // Still send raw base64 to Gemini so it can visually parse it
            contentParts.push({
               inlineData: {
                  data: base64Data,
                  mimeType
               }
            });
         });
      }

      const MAX_PIPELINE_ATTEMPTS = 3;
      let validGameData = null;
      let lastPipelineError = "";

      for (let attempt = 1; attempt <= MAX_PIPELINE_ATTEMPTS; attempt++) {
          try {
              console.log(`--- Pipeline Attempt ${attempt}/${MAX_PIPELINE_ATTEMPTS} ---`);
              
              let text = await generateWithRetry(model, contentParts, 3);
              console.log("Initial generation complete. Running AI QA Verification...");

              const verificationPrompt = `You are a strict QA integration tester checking the game code I just generated.
Here is the raw output:

${text}

VERIFICATION CHECKLIST:
1. Does the code perfectly implement \`initGame()\`, \`startGame(bet)\`, and \`resetGame()\`?
2. Are there ANY JavaScript syntax errors (missing brackets, undefined variables, bad loops)?
3. Are all HTML/CSS tags properly formatted and closed?
4. Are you returning exactly the required JSON format and HTML boilerplate?
5. Did you accidentally generate a "Spin", "Play", "Bet", or "Start Game" button in the HTML? If YES, YOU MUST DELETE IT. We use postMessage to start the game!
6. If the user provided images, did you actually use \`window.USER_IMAGES\` inside the generated HTML/JS? If you ignored the images and used Emojis instead, REWRITE the code to use \`window.USER_IMAGES\`.
7. CRITICAL RESULT CHECK: Does your code explicitly call \`sendResult(multiplier)\` after a visual spin/round finishes?! If the animations complete but no result is sent, the game is completely broken. Forcefully add \`sendResult(multiplier)\` at the very end of your gameplay sequence!

If there are ANY errors, bugs, or rule violations, FIX THEM and output the completely corrected JSON + HTML.
If the code is 100% bug-free and fully meets the complexity requirements, just output the exact original JSON + HTML again.
CRITICAL: ONLY OUTPUT THE JSON AND HTML. DO NOT ADD ANY CONVERSATIONAL TEXT.`;

              let verifyText = await generateWithRetry(model, [{ text: verificationPrompt }], 2);
              text = verifyText;
              console.log("AI QA Verification complete.");

              const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)?.[1] || text.match(/\{[\s\S]*?\}/)?.[0];
              if (!jsonMatch) throw new Error("Failed to parse JSON out of text response.");

              const parsedData = JSON.parse(jsonMatch);

              let htmlMatch = text.match(/```(?:html)?\s*(<!DOCTYPE html>[\s\S]*?.*?)\s*```/i)?.[1] || text.match(/<!DOCTYPE html>[\s\S]*/i)?.[0];
              if (!htmlMatch) throw new Error("Failed to parse HTML out of text response.");

              // STATIC ANALYSIS VALIDATION
              if (!htmlMatch.includes('startGame')) throw new Error("Static Analysis Failed: Missing 'startGame' function in HTML");
              if (!htmlMatch.includes('initGame')) throw new Error("Static Analysis Failed: Missing 'initGame' function in HTML");
              if (!htmlMatch.includes('resetGame')) throw new Error("Static Analysis Failed: Missing 'resetGame' function in HTML");
              if (!htmlMatch.includes('sendResult') && !htmlMatch.includes('GAME_RESULT') && !htmlMatch.includes('postMessage')) {
                  throw new Error("Static Analysis Failed: Game does not send results back (missing sendResult)! User would be stuck.");
              }

              // JS SYNTAX VALIDATION (Compile all script tags on the server to check for Syntax Errors)
              const scriptTags = htmlMatch.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
              if (scriptTags) {
                  for (const tag of scriptTags) {
                      const innerMatch = tag.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
                      if (innerMatch && innerMatch[1]) {
                          try {
                              // new Function compiles the JS without executing it, throwing if syntax is bad
                              new Function(innerMatch[1]);
                          } catch(syntaxErr: any) {
                              throw new Error(`Static Analysis Failed: JS Syntax Error in generated code: ${syntaxErr.message}`);
                          }
                      }
                  }
              }

              // Inject USER_IMAGES and guaranteed START_GAME listener into the HTML
              const guaranteedListener = `
window.addEventListener('message', (event) => {
    try {
        if (event.data && event.data.type === 'START_GAME') {
            if (typeof startGame === 'function') {
                startGame(event.data.bet || 10);
            }
        } else if (event.data && event.data.type === 'RESET') {
            if (typeof resetGame === 'function') {
                resetGame();
            }
        } else if (event.data && event.data.type === 'UPDATE_ASSETS') {
            window.CUSTOM_ASSETS = event.data.assets || {};
            if (typeof initGame === 'function') initGame();
            if (typeof resetGame === 'function') resetGame();
        }
    } catch(e) { console.error("Error in injected listener:", e); }
});
window.renderCustomAsset = (id, fallback) => {
    const val = (window.CUSTOM_ASSETS && window.CUSTOM_ASSETS[id]) || fallback;
    if (val && typeof val === 'string' && val.startsWith('data:image')) {
        return '<img src="' + val + '" style="width:100%; height:100%; object-fit:contain;" alt="">';
    }
    return val;
};
`;

              const scriptToInject = `\n<script>\n// INJECTED BY SYSTEM\nwindow.USER_IMAGES = ${savedImageUrls.length > 0 ? JSON.stringify(savedImageUrls) : '[]'};\nwindow.CUSTOM_ASSETS = {};\n${guaranteedListener}\n</script>\n`;
              
              // Insert right before </head> or <body>
              if (htmlMatch.includes('</head>')) {
                  htmlMatch = htmlMatch.replace('</head>', `${scriptToInject}</head>`);
              } else if (htmlMatch.includes('<body>')) {
                  htmlMatch = htmlMatch.replace('<body>', `<body>${scriptToInject}`);
              } else {
                  htmlMatch = scriptToInject + htmlMatch;
              }

              parsedData.htmlCode = htmlMatch.trim();

              if (!parsedData.gameName || !parsedData.htmlCode) throw new Error('Missing required JSON fields (gameName or htmlCode)');

              console.log("Static Analysis Passed! Game is valid.");
              validGameData = parsedData;
              break; // Success! Exit the loop.

          } catch (err: any) {
              lastPipelineError = err.message;
              console.error(`Pipeline Attempt ${attempt} failed:`, lastPipelineError);
              if (attempt === MAX_PIPELINE_ATTEMPTS) {
                  return NextResponse.json({ error: `AI generated an invalid game after 3 attempts. Reason: ${lastPipelineError}` }, { status: 500 });
              }
          }
      }

      return NextResponse.json({ success: true, data: validGameData });

   } catch (error: any) {
      console.error('Error generating game:', error);
      const message = error?.message || 'Internal Server Error';
      return NextResponse.json({ error: message }, { status: 500 });
   }
}
