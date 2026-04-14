import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore
import { JSDOM, VirtualConsole } from 'jsdom';

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
        let _resultSent = false;
        const _allTimeouts = [];
        const _allIntervals = [];
        const _origSetTimeout = window.setTimeout;
        const _origSetInterval = window.setInterval;
        window.setTimeout = function(fn, delay, ...args) { const id = _origSetTimeout(fn, delay, ...args); _allTimeouts.push(id); return id; };
        window.setInterval = function(fn, delay, ...args) { const id = _origSetInterval(fn, delay, ...args); _allIntervals.push(id); return id; };

        window.addEventListener("message", (event) => {
            if (event.data.type === 'START_GAME') { currentBet = event.data.bet; _resultSent = false; startGame(currentBet); }
            else if (event.data.type === 'RESET') { resetGame(); }
        });
        window.onload = () => { 
            initGame();
            parent.postMessage({ type: 'GAME_READY' }, '*'); 
        };
        function sendResult(multiplier) {
            if (_resultSent) return; // Prevent double-sending
            _resultSent = true;
            parent.postMessage({ type: 'GAME_RESULT', win: multiplier > 0, multiplier: multiplier }, '*');
        }

        // --- YOUR EXOTIC GAME LOGIC BELOW ---
        function initGame() {
            // CRUCIAL: Draw the beautiful initial idle state with animations BEFORE the user starts. NEVER leave a blank screen!
        }
        function startGame(bet) {
            // MUST have 3 phases: (1) Suspense buildup with animations, (2) Core resolution logic, (3) call sendResult(multiplier) ALWAYS
            // SAFETY NET — if your logic somehow fails to call sendResult within 6 sec, force it:
            setTimeout(() => { if (!_resultSent) sendResult(0); }, 6000);
        }
        function resetGame() {
            _resultSent = false;
            _allTimeouts.forEach(id => clearTimeout(id));
            _allIntervals.forEach(id => clearInterval(id));
            _allTimeouts.length = 0;
            _allIntervals.length = 0;
            // Clear UI, reset to idle for next round
        }
    </script>
</body>
</html>
\`\`\`

MANDATORY DESIGN STANDARD (follow this EXACTLY):
- BACKGROUND: Use \`#0A111A\` or \`radial-gradient(ellipse at center, #0a111a 0%, #06090c 100%)\` as the base. Add a subtle animated glow using themeColor at 10% opacity.
- CARDS/PANELS: Use deep dark glassmorphism — \`bg-[#121c22]/80 backdrop-blur-xl border border-white/5 rounded-2xl\`.
- ACCENT GLOW: All interactive elements must feature themeColor with \`box-shadow: 0 0 20px {themeColor}40;\`.
- TYPOGRAPHY: Use font-family 'Inter'. Titles: font-weight 900, uppercase, letter-spacing 0.1em.
- SPACING: Generous padding (min 24px). No cramped layouts.

AUDIO INTEGRATION:
- Request sound effects using: \`parent.postMessage({ type: 'PLAY_SOUND', soundType: 'spin' }, '*');\`
- Valid soundTypes: \`spin\` (slots/wheel), \`rise\` (crash/rockets), \`tumble\` (dice), \`blip\` (mines/plinko).
- Fire once per round, not in loops.

======= CRITICAL GAMEPLAY RULES =======

1. OUTCOME DISTRIBUTION (use this EXACT pattern in startGame):
   \`\`\`js
   const roll = Math.random();
   let multiplier = 0; // default: loss
   if (roll < 0.01)      multiplier = 25;  // 1% jackpot
   else if (roll < 0.06) multiplier = 5;   // 5% big win
   else if (roll < 0.25) multiplier = 1.5; // 19% small win
   // else multiplier stays 0 — 75% loss
   \`\`\`
   This EXACT distribution must be in every game. Adjust the multiplier display values for flavor but the thresholds MUST remain.

2. sendResult() MUST BE CALLED EVERY ROUND — NO EXCEPTIONS.
   - Put this safety net at the TOP of startGame: \`setTimeout(() => { if (!_resultSent) sendResult(0); }, 6000);\`
   - After your animation finishes, call \`sendResult(multiplier);\` explicitly.
   - The variable \`_resultSent\` (defined in the boilerplate) prevents double-sends.

3. resetGame() MUST:
   - Set \`_resultSent = false;\`
   - Clear ALL timeouts/intervals using the tracked arrays
   - Reset the visual UI back to idle state
   - Be callable multiple times without errors

4. NO IN-GAME BUTTONS: Do NOT create "Spin", "Bet", "Play", "Cashout", or "Start" buttons. The parent controls the game via postMessage.

5. MULTIMODAL: If the user provides images (\`window.USER_IMAGES\`), YOU MUST USE THEM instead of emojis.

6. CUSTOMIZABLE ASSETS:
   - Identify 2-4 thematic elements the user might want to replace
   - List them in JSON: \`"customizableAssets": [{"id": "gem", "name": "Gem", "default": "💎"}]\`
   - In your code, render ALL of them via: \`element.innerHTML = window.renderCustomAsset('gem', '💎');\`
   - NEVER use textContent or innerText for assets — renderCustomAsset may return <img> HTML
   - The function window.renderCustomAsset is injected automatically, you just call it

7. IDLE STATE: initGame() MUST render a beautiful animated idle state. Include subtle CSS animations. NEVER leave a blank screen.

8. VISUAL FEEDBACK:
   - Wins: Spawn 30+ confetti particles via JS, flash screen, show floating multiplier text
   - Big wins: More intense particles, screen shake
   - Losses: Subtle red flash or fade effect
   - ALL tiers must have visually distinct feedback

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
               // Wait 2.5 seconds before retrying to prevent infinite loading times
               await new Promise(resolve => setTimeout(resolve, 2500 * (i + 1)));
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
         model: "gemini-2.5-pro",
         generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 8192,
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

VERIFICATION CHECKLIST — check EVERY item:
1. Does \`startGame(bet)\` contain the EXACT outcome distribution pattern?
   \`const roll = Math.random(); let multiplier = 0; if (roll < 0.01) multiplier = 25; else if (roll < 0.06) multiplier = 5; else if (roll < 0.25) multiplier = 1.5;\`
   If this pattern is missing or different thresholds are used, ADD IT.
2. Does \`startGame\` call \`sendResult(multiplier)\` AT THE END after animations complete? This is MANDATORY.
3. Is there a safety timeout at the TOP of startGame: \`setTimeout(() => { if (!_resultSent) sendResult(0); }, 6000);\`? If not, ADD IT.
4. Does \`resetGame()\` set \`_resultSent = false;\` and clear timeouts/intervals? If not, FIX IT.
5. Are there ANY JavaScript syntax errors (missing brackets, undefined variables)?
6. Did you accidentally create a "Spin", "Play", "Bet", or "Start" button? If YES, DELETE IT.
7. If the user provided images (\`window.USER_IMAGES\`), did you actually use them? If emojis are used instead, REWRITE to use the images.
8. Are customizable assets rendered via \`innerHTML = window.renderCustomAsset(id, fallback)\`? If \`textContent\` or \`innerText\` is used, FIX to \`innerHTML\`.
9. Does \`initGame()\` draw a visible idle state? A blank screen is UNACCEPTABLE.

If there are ANY errors, bugs, or rule violations, FIX THEM and output the completely corrected JSON + HTML.
If the code is 100% correct, output the exact original JSON + HTML again.
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
              // Check for outcome distribution — Math.random must exist for fair gameplay
              if (!htmlMatch.includes('Math.random')) {
                  console.warn("WARNING: Game does not use Math.random() — may have deterministic/broken outcomes.");
              }
              // Check for forbidden in-game buttons
              const buttonPatterns = ['>Spin<', '>Play<', '>Start<', '>Bet<', '>Cashout<', '>spin<', '>play<', '>start<'];
              for (const bp of buttonPatterns) {
                  if (htmlMatch.includes(bp)) {
                      // Remove the offending button text
                      htmlMatch = htmlMatch.replace(new RegExp(bp, 'gi'), '><');
                      console.warn(`Removed forbidden in-game button text: ${bp}`);
                  }
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


              // Inject USER_IMAGES, safety nets, and guaranteed listeners into the HTML
              const guaranteedListener = `
// === SYSTEM SAFETY LAYER ===
// Ensure _resultSent exists (prevents double-send)
if (typeof _resultSent === 'undefined') { window._resultSent = false; }

// Timeout/interval tracking for proper cleanup
if (typeof _allTimeouts === 'undefined') { window._allTimeouts = []; }
if (typeof _allIntervals === 'undefined') { window._allIntervals = []; }

// Override sendResult to be idempotent
const _origSendResult = typeof sendResult === 'function' ? sendResult : null;
window.sendResult = function(multiplier) {
    if (window._resultSent) return;
    window._resultSent = true;
    parent.postMessage({ type: 'GAME_RESULT', win: multiplier > 0, multiplier: multiplier }, '*');
};

// Wrap startGame with try-catch and safety timeout
const _origStartGame = typeof startGame === 'function' ? startGame : null;
window.startGame = function(bet) {
    window._resultSent = false;
    // Safety net: force result after 6s
    const safetyId = setTimeout(function() { if (!window._resultSent) window.sendResult(0); }, 6000);
    window._allTimeouts.push(safetyId);
    try {
        if (_origStartGame) _origStartGame(bet);
    } catch(e) {
        console.error('startGame error:', e);
        if (!window._resultSent) window.sendResult(0);
    }
};

// Wrap resetGame with safety
const _origResetGame = typeof resetGame === 'function' ? resetGame : null;
window.resetGame = function() {
    window._resultSent = false;
    // Clear tracked timeouts and intervals
    (window._allTimeouts || []).forEach(function(id) { try { clearTimeout(id); } catch(e) {} });
    (window._allIntervals || []).forEach(function(id) { try { clearInterval(id); } catch(e) {} });
    window._allTimeouts = [];
    window._allIntervals = [];
    try {
        if (_origResetGame) _origResetGame();
    } catch(e) { console.error('resetGame error:', e); }
};

// Guaranteed message listener (backup)
window.addEventListener('message', function(event) {
    try {
        if (!event.data || typeof event.data !== 'object') return;
        if (event.data.type === 'START_GAME') {
            if (typeof window.startGame === 'function') window.startGame(event.data.bet || 10);
        } else if (event.data.type === 'RESET') {
            if (typeof window.resetGame === 'function') window.resetGame();
        } else if (event.data.type === 'UPDATE_ASSETS') {
            window.CUSTOM_ASSETS = event.data.assets || {};
            if (typeof initGame === 'function') initGame();
        }
    } catch(e) { console.error("Error in injected listener:", e); }
});

// Render custom assets (supports emoji, base64, and URL images)
window.renderCustomAsset = function(id, fallback) {
    var val = (window.CUSTOM_ASSETS && window.CUSTOM_ASSETS[id]) || fallback;
    if (val && typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('/uploads/') || val.startsWith('http'))) {
        return '<img src="' + val + '" style="width:100%; height:100%; object-fit:contain;" alt="">';
    }
    return val || fallback;
};

// Backup GAME_READY after a delay in case initGame doesn't trigger it
setTimeout(function() { parent.postMessage({ type: 'GAME_READY' }, '*'); }, 1500);
`;

              const scriptToInject = `\n<script>\n// INJECTED BY SYSTEM\nwindow.USER_IMAGES = ${savedImageUrls.length > 0 ? JSON.stringify(savedImageUrls) : '[]'};\nwindow.CUSTOM_ASSETS = {};\n</script>\n`;

              // Inject the initialization script before </head>
              if (htmlMatch.includes('</head>')) {
                  htmlMatch = htmlMatch.replace('</head>', `${scriptToInject}</head>`);
              } else if (htmlMatch.includes('<body>')) {
                  htmlMatch = htmlMatch.replace('<body>', `<body>${scriptToInject}`);
              } else {
                  htmlMatch = scriptToInject + htmlMatch;
              }

              // Inject the safety layer AFTER the game's own script (before </body>)
              const safetyScript = `\n<script>\n// SYSTEM SAFETY LAYER\n${guaranteedListener}\n</script>\n`;
              if (htmlMatch.includes('</body>')) {
                  htmlMatch = htmlMatch.replace('</body>', `${safetyScript}</body>`);
              } else {
                  htmlMatch = htmlMatch + safetyScript;
              }

              parsedData.htmlCode = htmlMatch.trim();


              if (!parsedData.gameName || !parsedData.htmlCode) throw new Error('Missing required JSON fields (gameName or htmlCode)');

              // DYNAMIC EXECUTION TESTING via JSDOM
              console.log("Running Dynamic Execution Test via JSDOM...");
              
              const virtualConsole = new VirtualConsole();
              // Prevent JSDOM errors from breaking the server log too much
              virtualConsole.on("error", () => {});
              virtualConsole.on("warn", () => {});
              virtualConsole.on("jsdomError", () => {});
              
              const dom = new JSDOM(parsedData.htmlCode, { 
                  runScripts: "dangerously",
                  resources: "usable",
                  virtualConsole,
                  beforeParse(window: any) {
                      // Mock canvas to prevent crashes if game uses it
                      window.HTMLCanvasElement.prototype.getContext = function () {
                          return {
                              fillRect: () => {}, clearRect: () => {}, getImageData: () => ({ data: [] }),
                              putImageData: () => {}, createImageData: () => ({}), setTransform: () => {},
                              drawImage: () => {}, save: () => {}, fillText: () => {}, restore: () => {},
                              beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, closePath: () => {},
                              stroke: () => {}, translate: () => {}, scale: () => {}, rotate: () => {},
                              arc: () => {}, fill: () => {}, measureText: () => ({ width: 0 }),
                              transform: () => {}, rect: () => {}, clip: () => {},
                          };
                      };
                      // Mock Audio
                      window.Audio = function() { return { play: () => {}, pause: () => {}, load: () => {} }; };
                  }
              });

              let results: any[] = [];
              dom.window.parent = {
                  postMessage: (msg: any) => {
                      if (msg && msg.type === 'GAME_RESULT') {
                          results.push(msg);
                      }
                  }
              };

              const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

              try {
                  // Wait for init
                  await sleep(500);
                  
                  // TEST 1: First Start
                  dom.window.postMessage({ type: 'START_GAME', bet: 10 }, '*');
                  
                  // Wait up to 6.5s to see if a result is sent
                  let waitedFor = 0;
                  while (results.length === 0 && waitedFor < 6500) {
                      await sleep(200);
                      waitedFor += 200;
                  }

                  if (results.length === 0) {
                      throw new Error("Dynamic Test Failed: Game did not return GAME_RESULT within 6.5s on first play.");
                  }
                  
                  console.log("First play passed.");

                  // TEST 2: Reset and Play Again
                  dom.window.postMessage({ type: 'RESET' }, '*');
                  await sleep(200);
                  
                  let initialResultsCount = results.length;
                  dom.window.postMessage({ type: 'START_GAME', bet: 10 }, '*');
                  
                  waitedFor = 0;
                  while (results.length === initialResultsCount && waitedFor < 6500) {
                      await sleep(200);
                      waitedFor += 200;
                  }

                  if (results.length === initialResultsCount) {
                      throw new Error("Dynamic Test Failed: Game did not return GAME_RESULT on the second play (after RESET).");
                  }

                  console.log("Second play passed.");
              } finally {
                  // Cleanup memory
                  dom.window.close();
              }

              console.log("Static and Dynamic Analysis Passed! Game is perfectly valid.");
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
