"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2, Bot, Wand2, Save, Upload, ImageIcon, X, Eye, RotateCcw, AlertTriangle, Trash2, Play, Clock, Gamepad2, LayoutTemplate, Palette, Volume2 } from 'lucide-react';

const playSynthSound = (type: string) => {
    try {
        if (type === 'spin') {
            const audio = new Audio('/game sounds/slots.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }
        if (type === 'tumble') {
            const audio = new Audio('/game sounds/dice.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'rise') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 2.0);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
        } else if (type === 'blip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        } else {
             return;
        }
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
    } catch(e) {}
};

interface CreatorGameStudioProps {
    creatorData: any;
    onGoBack: () => void;
}

const WIN_EFFECTS = [
    { id: 'confetti', icon: '🎉', name: 'Confetti' },
    { id: 'fireworks', icon: '🎆', name: 'Fireworks' },
    { id: 'stars', icon: '⭐', name: 'Stars' },
    { id: 'snow', icon: '❄️', name: 'Snow' },
    { id: 'coins', icon: '💰', name: 'Coins' },
    { id: 'none', icon: '❌', name: 'None' },
];

export default function CreatorGameStudio({ creatorData, onGoBack }: CreatorGameStudioProps) {
    const [creationMode, setCreationMode] = useState<'ai' | 'template'>('ai');
    const [selectedTemplate, setSelectedTemplate] = useState('slot');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiImages, setAiImages] = useState<{name: string, data: string}[]>([]);
    const [aiCustomAssets, setAiCustomAssets] = useState<{id: string, name: string, default: string, current: string}[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [gameName, setGameName] = useState('My Awesome Game');
    const [gameDescription, setGameDescription] = useState('Click to edit this description...');
    const [themeEmoji, setThemeEmoji] = useState('🎲');
    const [themeColor, setThemeColor] = useState('#00b9f0');
    const [slotSymbols, setSlotSymbols] = useState<string[]>(['🍒', '🍋', '🍉', '⭐', '💎']);
    const [crashIcons, setCrashIcons] = useState<string[]>(['🚀', '💥']);
    const [diceIcons, setDiceIcons] = useState<string[]>(['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']);
    const [minesIcons, setMinesIcons] = useState<string[]>(['💎', '💣']);
    const [plinkoIcons, setPlinkoIcons] = useState<string[]>(['⚪', '🔴']);
    const [wheelIcons, setWheelIcons] = useState<string[]>(['🎯', '🎲', '⭐', '💰', '🎁', '🔥']);
    const [htmlCode, setHtmlCode] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [winEffect, setWinEffect] = useState('confetti');
    const [winSound, setWinSound] = useState<string | null>(null);
    const [gameBackgroundImage, setGameBackgroundImage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [editingField, setEditingField] = useState<'name' | 'desc' | 'emoji' | null>(null);
    const [publishedGames, setPublishedGames] = useState<any[]>([]);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'passed' | 'failed' | 'retrying'>('idle');
    const [aiRetryCount, setAiRetryCount] = useState(0);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const verifyIframeRef = useRef<HTMLIFrameElement>(null);

    // Load published games from localStorage
    useEffect(() => {
        const loadGames = () => {
            const data = localStorage.getItem('custom_published_games');
            if (data) {
                try {
                    const allGames = JSON.parse(data);
                    const myGames = allGames.filter((g: any) => 
                        g.creatorId === (creatorData.id || creatorData.name) || 
                        g.creatorName === creatorData.name
                    );
                    setPublishedGames(myGames);
                } catch (e) {
                    console.error(e);
                }
            }
        };
        loadGames();
        window.addEventListener('storage', loadGames);
        return () => window.removeEventListener('storage', loadGames);
    }, [creatorData]);

    // Global listener for sounds triggered by games in preview
    useEffect(() => {
        const handleGlobalMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PLAY_SOUND' && event.data.soundType) {
                playSynthSound(event.data.soundType);
            }
        };
        window.addEventListener('message', handleGlobalMessage);
        return () => window.removeEventListener('message', handleGlobalMessage);
    }, []);

    const updateCustomAsset = (id: string, newImageBase64: string) => {
        const updated = aiCustomAssets.map(a => a.id === id ? { ...a, current: newImageBase64 } : a);
        setAiCustomAssets(updated);

        const assetsObj = updated.reduce((acc, curr) => {
            acc[curr.id] = curr.current !== curr.default ? curr.current : curr.default;
            return acc;
        }, {} as Record<string, string>);

        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_ASSETS', assets: assetsObj }, '*');
        }

        setHtmlCode(prev => prev.replace(/window\.CUSTOM_ASSETS\s*=\s*\{.*?\};/, `window.CUSTOM_ASSETS = ${JSON.stringify(assetsObj)};`));
    };

    const deleteGame = (gameId: string) => {
        const data = localStorage.getItem('custom_published_games');
        if (data) {
            const allGames = JSON.parse(data);
            const filtered = allGames.filter((g: any) => g.id !== gameId);
            localStorage.setItem('custom_published_games', JSON.stringify(filtered));
            // Trigger storage event for other tabs/components
            window.dispatchEvent(new Event('storage'));
            setPublishedGames(prev => prev.filter(g => g.id !== gameId));
        }
    };

    const handleAIGenerate = async (retryAttempt = 0) => {
        if (!aiPrompt.trim()) return;
        if (retryAttempt === 0) {
            setIsGenerating(true);
            setGenerationError('');
            setAiRetryCount(0);
        }
        setVerificationStatus('idle');

        try {
            const res = await fetch('/api/generate-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt, images: aiImages.map(img => img.data) })
            });

            const data = await res.json();

            if (data.success && data.data) {
                const gameData = data.data;
                setGameName(gameData.gameName || '');
                setGameDescription(gameData.gameDescription || '');
                setThemeEmoji(gameData.themeEmoji || '🎮');
                setThemeColor(gameData.themeColor || '#a855f7');
                
                if (gameData.customizableAssets && Array.isArray(gameData.customizableAssets)) {
                    setAiCustomAssets(gameData.customizableAssets.map((a: any) => ({...a, current: a.default})));
                } else {
                    setAiCustomAssets([]);
                }

                const generatedCode = gameData.htmlCode || '';
                setHtmlCode(generatedCode);
                setShowPreview(true);
                setIsGenerating(false);

                // --- CLIENT-SIDE AUTO-VERIFICATION ---
                setVerificationStatus('verifying');
                const verifyResult = await verifyGameViaPostMessage(generatedCode);

                if (verifyResult) {
                    setVerificationStatus('passed');
                } else {
                    // Failed verification
                    if (retryAttempt < 2) {
                        setVerificationStatus('retrying');
                        setAiRetryCount(retryAttempt + 1);
                        setGenerationError(`Game failed verification (attempt ${retryAttempt + 1}/3). Auto-regenerating...`);
                        // Small delay then retry
                        await new Promise(r => setTimeout(r, 1500));
                        return handleAIGenerate(retryAttempt + 1);
                    } else {
                        setVerificationStatus('failed');
                        setGenerationError('Game failed verification after 3 attempts. You can still preview it manually or try a different prompt.');
                    }
                }
            } else {
                setGenerationError(data.error || 'Unknown error. Please try again.');
                setIsGenerating(false);
            }
        } catch (error) {
            console.error("Error calling AI:", error);
            setGenerationError('Connection error. Please check your internet and try again.');
            setIsGenerating(false);
        }
    };

    /** Loads generated HTML in a hidden iframe, sends START_GAME, waits for GAME_RESULT */
    const verifyGameViaPostMessage = (code: string): Promise<boolean> => {
        return new Promise((resolve) => {
            // Create a hidden iframe for testing
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.width = '400px';
            iframe.style.height = '500px';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.sandbox.add('allow-scripts');
            document.body.appendChild(iframe);

            let resolved = false;
            let gameReady = false;

            const cleanup = () => {
                window.removeEventListener('message', onMessage);
                try { document.body.removeChild(iframe); } catch(e) {}
            };

            const onMessage = (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'object') return;

                if (event.data.type === 'GAME_READY') {
                    gameReady = true;
                    // Send START_GAME test
                    setTimeout(() => {
                        try {
                            iframe.contentWindow?.postMessage({ type: 'START_GAME', bet: 10 }, '*');
                        } catch(e) { console.error('Verify postMessage error:', e); }
                    }, 500);
                }

                if (event.data.type === 'GAME_RESULT') {
                    if (!resolved) {
                        resolved = true;
                        cleanup();
                        resolve(true); // Game works!
                    }
                }
            };

            window.addEventListener('message', onMessage);

            // Load the game code using srcdoc to keep parent origin for relative paths
            iframe.srcdoc = code;

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    console.warn('Game verification timed out. gameReady=' + gameReady);
                    resolve(false); // Game is broken
                }
            }, 10000);
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, maxWidth = 800) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    callback(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Fișierul audio este prea mare. Limita este de 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                callback(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > 800) {
                        height *= 800 / width;
                        width = 800;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    setAiImages(prev => [...prev, { name: file.name, data: canvas.toDataURL('image/webp', 0.8) }]);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAiImage = (index: number) => {
        setAiImages(prev => prev.filter((_, i) => i !== index));
    };

    const getGeneratedTemplateHtml = () => {
        let generatedHtml = '';

        if (selectedTemplate === 'slot') {
            const symbolsJson = JSON.stringify(slotSymbols);
            generatedHtml = `
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: ${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};
    color: white;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
  }
  .bg-glow {
    position: absolute; inset: 0; opacity: 0.15; pointer-events: none;
    background: radial-gradient(ellipse at center, ${themeColor}, transparent 70%);
  }
  .game-container {
    position: relative; z-index: 10;
    display: flex; flex-direction: column; align-items: center; gap: 24px;
  }
  .slot-frame {
    padding: 24px 32px;
    border-radius: 24px;
    border: 8px solid ${themeColor}20;
    background: linear-gradient(to bottom, ${themeColor}40, #0a1114);
    box-shadow: inset 0 20px 50px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.5);
  }
  .slot-inner {
    display: flex; gap: 16px;
    background: #06090c;
    padding: 16px 20px;
    border-radius: 16px;
    box-shadow: inset 0 5px 15px rgba(0,0,0,0.5);
    border: 4px solid #0f171c;
  }
  .slot-column {
    width: 180px; height: 260px;
    background: #121c22;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: inset 0 5px 15px rgba(0,0,0,0.3);
  }
  .slot-column::before, .slot-column::after {
    content: ''; position: absolute; left: 0; right: 0; z-index: 20; pointer-events: none;
  }
  .slot-column::before {
    top: 0; height: 40%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
  }
  .slot-column::after {
    bottom: 0; height: 40%;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  }
  .symbol-wrap {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 110px;
    filter: drop-shadow(0 0 15px rgba(255,255,255,0.2));
    transition: transform 0.3s ease;
  }
  .symbol-wrap img {
    width: 75%; height: 75%; object-fit: contain;
    filter: drop-shadow(0 0 10px rgba(255,255,255,0.15));
  }
  @keyframes spinReel {
    0% { transform: translateY(0); }
    100% { transform: translateY(-1000px); }
  }
  .reel-strip {
    display: flex; flex-direction: column; align-items: center;
    position: absolute; left: 0; right: 0;
  }
  .reel-strip .sym-cell {
    width: 100%; height: 260px; display: flex; align-items: center; justify-content: center;
    font-size: 110px;
  }
  .reel-strip .sym-cell img {
    width: 75%; height: 75%; object-fit: contain;
  }
  .spinning .reel-strip {
    animation: spinReel 0.25s linear infinite;
  }
  .result-text {
    font-size: 18px; font-weight: 800; height: 28px; text-align: center;
    letter-spacing: 2px; text-transform: uppercase;
  }
  .spin-btn {
    padding: 16px 48px; border-radius: 12px; border: none;
    font-weight: 900; font-size: 18px; color: white;
    text-transform: uppercase; letter-spacing: 3px;
    cursor: pointer; transition: all 0.2s;
    background: linear-gradient(to right, ${themeColor}, ${themeColor}aa);
    box-shadow: 0 0 20px ${themeColor}60;
  }
  .spin-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
  .spin-btn:active { transform: scale(0.97); }
  .spin-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="game-container">
    <div class="slot-frame">
      <div class="slot-inner">
        <div class="slot-column" id="col0"><div class="symbol-wrap" id="sw0"></div></div>
        <div class="slot-column" id="col1"><div class="symbol-wrap" id="sw1"></div></div>
        <div class="slot-column" id="col2"><div class="symbol-wrap" id="sw2"></div></div>
      </div>
    </div>
    <div id="result" class="result-text">Waiting...</div>
  </div>

  <script>
    const symbols = ${symbolsJson};
    const renderSym = (s) => s.startsWith('data:image') ? '<img src="'+s+'">' : s;
    const cols = [
      { el: document.getElementById('col0'), sw: document.getElementById('sw0') },
      { el: document.getElementById('col1'), sw: document.getElementById('sw1') },
      { el: document.getElementById('col2'), sw: document.getElementById('sw2') }
    ];
    const resultEl = document.getElementById('result');

    // Init with random symbols
    cols.forEach(c => { c.sw.innerHTML = renderSym(symbols[Math.floor(Math.random() * symbols.length)]); });

    let isPlaying = false;

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'START_GAME') {
        if (isPlaying) return;
        isPlaying = true;
        resultEl.innerHTML = "Spinning...";
        resultEl.style.color = "white";

        // Create spinning strips
        cols.forEach(c => {
          let stripHtml = '';
          for (let i = 0; i < 8; i++) {
            stripHtml += '<div class="sym-cell">' + renderSym(symbols[Math.floor(Math.random() * symbols.length)]) + '</div>';
          }
          c.sw.innerHTML = '<div class="reel-strip">' + stripHtml + '</div>';
          c.el.classList.add('spinning');
        });

        // Determine results
        const finalResults = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];

        // 15% win chance
        if (Math.random() > 0.85) {
          const target = symbols[Math.floor(Math.random() * symbols.length)];
          finalResults[0] = target; finalResults[1] = target; finalResults[2] = target;
        }

        // Stop reels with stagger
        cols.forEach((c, idx) => {
          setTimeout(() => {
            c.el.classList.remove('spinning');
            c.sw.innerHTML = renderSym(finalResults[idx]);

            if (idx === 2) {
              const win = finalResults[0] === finalResults[1] && finalResults[1] === finalResults[2];
              const multiplier = win ? 5.0 : 0;
              resultEl.innerHTML = win ? "🎰 YOU WIN " + multiplier + "x! 🎰" : "BETTER LUCK NEXT TIME";
              resultEl.style.color = win ? "${themeColor}" : "#94a3b8";
              isPlaying = false;

              if (window.parent) {
                window.parent.postMessage({ type: 'GAME_RESULT', win, multiplier }, '*');
              }
            }
          }, idx * 600 + 800);
        });
      }
    });

    if (window.parent) { window.parent.postMessage({ type: 'GAME_READY' }, '*'); }
  </script>
</body>
</html>`;
        } else if (selectedTemplate === 'crash') {
            const iconsJson = JSON.stringify(crashIcons);
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:24px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.chart-container{width:100%;max-width:650px;height:350px;border-left:4px solid ${themeColor}50;border-bottom:4px solid ${themeColor}50;position:relative;display:flex;align-items:flex-end;margin-bottom:30px;z-index:10}.mult{position:absolute;font-size:4rem;font-weight:900;text-shadow:0 0 20px rgba(0,0,0,0.8);color:${themeColor};top:25%;right:10%;display:flex;align-items:center;gap:12px;}.status{font-size:1.2rem;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;z-index:10}.rocket{position:absolute;width:64px;height:64px;transform:translate(-50%,50%);display:flex;align-items:center;justify-content:center;font-size:40px;transition:none;filter:drop-shadow(0 0 10px rgba(0,0,0,0.5))}</style></head><body><div class="bg-glow"></div><div style="z-index:10;text-align:center;margin-bottom:20px"><h1 style="font-size:2rem;font-weight:900;margin:0;color:white;text-transform:uppercase;letter-spacing:2px;text-shadow:0 0 10px ${themeColor}50">${gameName}</h1></div><div class="chart-container"><svg viewBox="0 0 100 100" style="width:100%;height:100%;position:absolute;inset:0;overflow:visible;" preserveAspectRatio="none"><path id="line" d="" fill="none" stroke="${themeColor}" stroke-width="4" filter="drop-shadow(0 0 8px ${themeColor})"/></svg><div id="rocket" class="rocket"></div><div class="mult" id="mult">1.00x</div></div><div class="status" id="status">Waiting...</div><script>const icons=${iconsJson};const renderIcon=(i)=>i&&i.startsWith('data:image')?'<img src="'+i+'" style="width:100%;height:100%;object-fit:contain;">':(i||'');let animFrame,crashed=false,mult=1,startTime;const svg=document.getElementById('svg'),line=document.getElementById('line'),multEl=document.getElementById('mult'),statusEl=document.getElementById('status'),rocket=document.getElementById('rocket');rocket.innerHTML=renderIcon(icons[0]);let isPlaying=false;window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(isPlaying)return;isPlaying=true;crashed=false;mult=1;line.setAttribute('d','');rocket.innerHTML=renderIcon(icons[0]);rocket.style.display='flex';rocket.style.left='0%';rocket.style.top='100%';multEl.innerHTML='1.00x';multEl.style.color='${themeColor}';statusEl.textContent='Launching...';statusEl.style.color='${themeColor}';const crashAt=1.1+Math.random()*4;startTime=Date.now();function tick(){if(crashed)return;const t=(Date.now()-startTime)/2000;mult=Math.pow(1.06,t*20);if(mult>=crashAt){crashed=true;rocket.style.display='none';multEl.innerHTML='<div style="width:40px;height:40px;display:inline-block">'+renderIcon(icons[1])+'</div> CRASHED';multEl.style.color='#ef4444';statusEl.textContent='Game Over';isPlaying=false;window.parent.postMessage({type:'GAME_RESULT',win:false,multiplier:0},'*');return}multEl.innerHTML=mult.toFixed(2)+'x';const w=100,h=100,pts=[];let lastPX=0,lastPY=h;for(let i=0;i<=t*20;i++){const m=Math.pow(1.06,i);const px=(i/(t*20+10))*100;const py=100-((m-1)/crashAt)*100;pts.push(px+','+py);lastPX=px;lastPY=py}line.setAttribute('d','M'+pts.join(' L'));rocket.style.left=lastPX+'%';rocket.style.top=lastPY+'%';animFrame=requestAnimationFrame(tick)}tick()}});window.parent.postMessage({type:'GAME_READY'},'*');</script></body></html>`;
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:24px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.chart-container{width:100%;max-width:650px;height:350px;border-left:4px solid ${themeColor}50;border-bottom:4px solid ${themeColor}50;position:relative;display:flex;align-items:flex-end;margin-bottom:30px;z-index:10}.mult{position:absolute;font-size:4rem;font-weight:900;text-shadow:0 0 20px rgba(0,0,0,0.8);color:${themeColor};top:25%;right:10%;display:flex;align-items:center;gap:12px;}.status{font-size:1.2rem;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;z-index:10}.rocket{position:absolute;width:64px;height:64px;transform:translate(-50%,50%);display:flex;align-items:center;justify-content:center;font-size:40px;transition:none;filter:drop-shadow(0 0 10px rgba(0,0,0,0.5))}.cashout-btn{padding:12px 32px;font-size:1rem;font-weight:900;background:linear-gradient(135deg, ${themeColor}, ${themeColor}80);color:white;border:none;border-radius:12px;cursor:pointer;box-shadow:0 0 20px ${themeColor}50;z-index:20;text-transform:uppercase;letter-spacing:2px;margin-top:20px;display:none; transition: transform 0.1s;}.cashout-btn:active{transform:scale(0.95)}</style></head><body><div class="bg-glow"></div><div class="chart-container"><svg viewBox="0 0 100 100" style="width:100%;height:100%;position:absolute;inset:0;overflow:visible;" preserveAspectRatio="none"><path id="line" d="" fill="none" stroke="${themeColor}" stroke-width="4" filter="drop-shadow(0 0 8px ${themeColor})"/></svg><div id="rocket" class="rocket"></div><div class="mult" id="mult">1.00x</div></div><div class="status" id="status">Waiting...</div><button class="cashout-btn" id="cashoutBtn">Cash Out</button><script>const icons=${iconsJson};const renderIcon=(i)=>i&&i.startsWith('data:image')?'<img src="'+i+'" style="width:100%;height:100%;object-fit:contain;">':(i||'');let animFrame,crashed=false,mult=1,startTime;const svg=document.getElementById('svg'),line=document.getElementById('line'),multEl=document.getElementById('mult'),statusEl=document.getElementById('status'),rocket=document.getElementById('rocket'),cashoutBtn=document.getElementById('cashoutBtn');rocket.innerHTML=renderIcon(icons[0]);let isPlaying=false;cashoutBtn.onclick=()=>{if(!isPlaying||crashed)return;crashed=true;isPlaying=false;cashoutBtn.style.display='none';statusEl.textContent='Cashed Out!';statusEl.style.color='${themeColor}';window.parent.postMessage({type:'GAME_RESULT',win:true,multiplier:mult},'*');};window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(isPlaying)return;isPlaying=true;crashed=false;mult=1;line.setAttribute('d','');rocket.innerHTML=renderIcon(icons[0]);rocket.style.display='flex';rocket.style.left='0%';rocket.style.top='100%';multEl.innerHTML='1.00x';multEl.style.color='${themeColor}';statusEl.textContent='Launching...';statusEl.style.color='${themeColor}';cashoutBtn.style.display='block';const crashAt=1.1+Math.random()*4;startTime=Date.now();function tick(){if(crashed)return;const t=(Date.now()-startTime)/2000;mult=Math.pow(1.06,t*20);if(mult>=crashAt){crashed=true;rocket.style.display='none';multEl.innerHTML='<div style="width:40px;height:40px;display:inline-block">'+renderIcon(icons[1])+'</div> CRASHED';multEl.style.color='#ef4444';statusEl.textContent='Game Over';isPlaying=false;cashoutBtn.style.display='none';window.parent.postMessage({type:'GAME_RESULT',win:false,multiplier:0},'*');return}multEl.innerHTML=mult.toFixed(2)+'x';const w=100,h=100,pts=[];let lastPX=0,lastPY=h;for(let i=0;i<=t*20;i++){const m=Math.pow(1.06,i);const px=(i/(t*20+10))*100;const py=100-((m-1)/crashAt)*100;pts.push(px+','+py);lastPX=px;lastPY=py}line.setAttribute('d','M'+pts.join(' L'));rocket.style.left=lastPX+'%';rocket.style.top=lastPY+'%';animFrame=requestAnimationFrame(tick)}tick()}});window.parent.postMessage({type:'GAME_READY'},'*');</script></body></html>`;
        } else if (selectedTemplate === 'dice') {
            const facesJson = JSON.stringify(diceIcons);
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:24px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.die-container{width:160px;height:160px;background:linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.5));border:4px solid ${themeColor}50;border-radius:32px;display:flex;align-items:center;justify-content:center;font-size:80px;box-shadow:0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05);z-index:10;transition:transform 0.1s;margin-bottom:30px;overflow:hidden;}.die-container img{width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5))}.status{font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;z-index:10}.shaking{animation:shake 0.15s infinite;}@keyframes shake{0%,100%{transform:rotate(0deg) scale(1)}25%{transform:rotate(-15deg) scale(1.1)}75%{transform:rotate(15deg) scale(1.1)}}</style></head><body><div class="bg-glow"></div><div class="die-container" id="die"></div><div class="status" id="status">Waiting...</div><script>const faces=${facesJson};const renderIcon=(i)=>i&&i.startsWith('data:image')?'<img src="'+i+'">':(i||'');const die=document.getElementById('die'),statusEl=document.getElementById('status');if(faces&&faces.length>0)die.innerHTML=renderIcon(faces[0]);let isPlaying=false;window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(isPlaying||!faces||faces.length===0)return;isPlaying=true;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'tumble'},'*');statusEl.textContent='Rolling...';statusEl.style.color='white';die.classList.add('shaking');let ticks=0;const iv=setInterval(()=>{die.innerHTML=renderIcon(faces[Math.floor(Math.random()*faces.length)]);ticks++;if(ticks>20){clearInterval(iv);die.classList.remove('shaking');const idx=Math.floor(Math.random()*faces.length);const win=idx>=Math.floor(faces.length/2);const mult=win?(idx+1)*0.5:0;die.innerHTML=renderIcon(faces[idx]);statusEl.textContent=win?'WIN '+mult.toFixed(2)+'x!':'Better luck!';statusEl.style.color=win?'${themeColor}':'#ef4444';isPlaying=false;window.parent.postMessage({type:'GAME_RESULT',win,multiplier:mult},'*');}},60);}});window.parent.postMessage({type:'GAME_READY'},'*');</script></body></html>`;
        } else if (selectedTemplate === 'mines') {
            const iconsJson = JSON.stringify(minesIcons);
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:16px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;background:#0c1319;padding:16px;border-radius:24px;box-shadow:inset 0 5px 20px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.05);z-index:10;margin-bottom:20px}.cell{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.5rem;transition:all 0.3s;box-shadow:inset 0 0 10px rgba(0,0,0,0.5);cursor:pointer;}.cell:hover:not(.disabled){background:rgba(255,255,255,0.1)}.cell.disabled{pointer-events:none}.cell.revealed{background:${themeColor}20;box-shadow:0 0 15px ${themeColor}40}.cell.bomb{background:#ef444430;box-shadow:0 0 15px #ef444440}.cell img{width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 5px 5px rgba(0,0,0,0.5))}.status{font-size:1rem;font-weight:700;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;z-index:10}.mult-display{font-size:2rem;font-weight:900;color:${themeColor};margin-bottom:20px;z-index:10}.cashout-btn{padding:12px 32px;font-size:1rem;font-weight:900;background:linear-gradient(135deg, ${themeColor}, ${themeColor}80);color:white;border:none;border-radius:12px;cursor:pointer;box-shadow:0 0 20px ${themeColor}50;z-index:10;text-transform:uppercase;letter-spacing:2px;transition:transform 0.1s;display:none;}.cashout-btn:active{transform:scale(0.95)}</style></head><body><div class="bg-glow"></div><div class="mult-display" id="mult">1.00x</div><div class="grid" id="grid"></div><div class="status" id="status">Waiting for bet...</div><button class="cashout-btn" id="cashoutBtn">Cash Out</button><script>const icons=${iconsJson};const renderIcon=(i)=>i&&i.startsWith('data:image')?'<img src="'+i+'">':(i||'');const gemIcon=icons[0],bombIcon=icons[1];const grid=document.getElementById('grid'),statusEl=document.getElementById('status'),multEl=document.getElementById('mult'),cashoutBtn=document.getElementById('cashoutBtn');let board=[],revealed=[],gameActive=false,mult=1,initBet=0,gemsCount=0;for(let i=0;i<25;i++){const c=document.createElement('div');c.className='cell disabled';grid.appendChild(c);c.onclick=()=>reveal(i);}window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(gameActive)return;gameActive=true;revealed=[];mult=1;gemsCount=0;multEl.textContent='1.00x';statusEl.textContent='Pick a tile!';statusEl.style.color='white';cashoutBtn.style.display='none';board=Array(25).fill('gem');for(let i=0;i<5;i++)board[i]='bomb';board.sort(()=>Math.random()-0.5);Array.from(grid.children).forEach(c=>{c.className='cell';c.innerHTML='';});}});function reveal(i){if(!gameActive||revealed.includes(i))return;revealed.push(i);const cell=grid.children[i];cell.classList.add('disabled');if(board[i]==='bomb'){if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'boom'},'*');cell.className='cell bomb disabled';cell.innerHTML=renderIcon(bombIcon);gameActive=false;statusEl.textContent='BOOM! You hit a mine';statusEl.style.color='#ef4444';cashoutBtn.style.display='none';Array.from(grid.children).forEach((c,idx)=>{if(!revealed.includes(idx)){c.className='cell disabled '+(board[idx]==='bomb'?'bomb':'revealed');c.innerHTML=renderIcon(board[idx]==='bomb'?bombIcon:gemIcon);}});setTimeout(()=>{window.parent.postMessage({type:'GAME_RESULT',win:false,multiplier:0},'*');}, 1500);}else{if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'blip'},'*');cell.className='cell revealed disabled';cell.innerHTML=renderIcon(gemIcon);gemsCount++;mult=parseFloat((1+gemsCount*0.25).toFixed(2));multEl.textContent=mult.toFixed(2)+'x';cashoutBtn.style.display='block';if(gemsCount>=20){cashout();}}}cashoutBtn.onclick=cashout;function cashout(){if(!gameActive||gemsCount===0)return;gameActive=false;statusEl.textContent='PAID OUT '+mult.toFixed(2)+'x!';statusEl.style.color='${themeColor}';cashoutBtn.style.display='none';Array.from(grid.children).forEach(c=>c.classList.add('disabled'));window.parent.postMessage({type:'GAME_RESULT',win:true,multiplier:mult},'*');}window.parent.postMessage({type:'GAME_READY'},'*');</script></body></html>`;
        } else if (selectedTemplate === 'plinko') {
            const iconsJson = JSON.stringify(plinkoIcons);
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:16px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.board{display:flex;flex-direction:column;align-items:center;gap:18px;z-index:10;position:relative;margin-bottom:30px;margin-top:20px;}.row{display:flex;gap:35px;}.peg{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.2);box-shadow:0 0 8px rgba(255,255,255,0.1)}.mults{display:flex;gap:12px;margin-top:15px}.mb{padding:10px 14px;font-size:16px;font-weight:900;border-radius:8px;background:${themeColor}40;color:${themeColor};box-shadow:0 0 15px rgba(0,0,0,0.4)}.status{font-size:1.2rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;z-index:10}.ball{position:absolute;width:32px;height:32px;border-radius:50%;top:0;left:50%;transform:translate(-50%, -150%);transition:transform 0.12s linear;opacity:0;display:flex;align-items:center;justify-content:center;font-size:24px;filter:drop-shadow(0 0 12px ${themeColor});z-index:20;}.ball img{width:100%;height:100%;object-fit:contain;}</style></head><body><div class="bg-glow"></div><div class="board" id="board"></div><div class="status" id="status">Waiting...</div><script>const icons=${iconsJson};const renderIcon=(i)=>i&&i.startsWith('data:image')?'<img src="'+i+'">':(i||'');const board=document.getElementById('board'),statusEl=document.getElementById('status');for(let r=1;r<=8;r++){const row=document.createElement('div');row.className='row';for(let c=0;c<r;c++){const peg=document.createElement('div');peg.className='peg';row.appendChild(peg);}board.appendChild(row);}const multsC=document.createElement('div');multsC.className='mults';const multVals=[10,5,2,1,0.5,1,2,5,10];multVals.forEach(m=>{const d=document.createElement('div');d.className='mb';d.textContent=m+'x';multsC.appendChild(d);});board.appendChild(multsC);const ball=document.createElement('div');ball.className='ball';ball.innerHTML=renderIcon(icons[0]);board.appendChild(ball);let isPlaying=false;window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(isPlaying)return;isPlaying=true;statusEl.textContent='Dropping...';statusEl.style.color='white';ball.style.transition='none';ball.style.transform='translate(-50%, -150%)';ball.style.opacity='1';setTimeout(()=>{ball.style.transition='transform 0.12s linear';let step=1;let pos=0;const iv=setInterval(()=>{let move=Math.random()>0.5?1:-1;pos+=move;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'blip'},'*');ball.style.transform=\`translate(calc(-50% + \${pos*17.5}px), \${step*32}px)\`;step++;if(step>8){clearInterval(iv);const idx=Math.min(Math.max(Math.floor(pos/2)+4,0),8);const wonMult=multVals[idx];statusEl.textContent=wonMult>=1?wonMult+'x WIN!':'Better luck!';statusEl.style.color=wonMult>=1?'${themeColor}':'#ef4444';setTimeout(()=>{ball.style.opacity='0';isPlaying=false;window.parent.postMessage({type:'GAME_RESULT',win:wonMult>0,multiplier:wonMult},'*');},1000);}},120);},50);}});window.parent.postMessage({type:'GAME_READY'},'*');</script></body></html>`;
        } else if (selectedTemplate === 'wheel') {
            const segsJson = JSON.stringify(wheelIcons);
            generatedHtml = `<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;padding:24px;width:100vw;height:100vh;overflow:hidden;background:${gameBackgroundImage ? `url('${gameBackgroundImage}') center/cover no-repeat` : '#06090c'};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif}.bg-glow{position:absolute;inset:0;opacity:0.15;pointer-events:none;background:radial-gradient(ellipse at center, ${themeColor}, transparent 70%);}.wheel-container{width:380px;height:380px;position:relative;margin-bottom:40px;z-index:10}canvas{width:100%;height:100%;border-radius:50%;box-shadow:0 0 60px rgba(0,0,0,0.8);border:12px solid #0c1319;transition:transform 3s cubic-bezier(0.25,1,0.5,1);}.marker{position:absolute;top:-16px;left:50%;transform:translateX(-50%);width:30px;height:38px;background:white;clip-path:polygon(50% 100%, 0 0, 100% 0);z-index:20;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.6))}.status{font-size:1.2rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;z-index:10}</style></head><body><div class="bg-glow"></div><div class="wheel-container"><div class="marker"></div><canvas id="wheel" width="500" height="500"></canvas></div><div class="status" id="status">Waiting...</div><script>const segs=${segsJson};const canvas=document.getElementById('wheel');const ctx=canvas.getContext('2d');const statusEl=document.getElementById('status');let isPlaying=false;let currentRot=0;const colors=['${themeColor}','#1e293b'];function draw(){ctx.clearRect(0,0,500,500);const n=segs.length;const arc=2*Math.PI/n;for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(250,250);ctx.arc(250,250,240,i*arc,(i+1)*arc);ctx.fillStyle=colors[i%2];ctx.fill();ctx.save();ctx.translate(250+165*Math.cos((i+0.5)*arc),250+165*Math.sin((i+0.5)*arc));ctx.rotate((i+0.5)*arc);ctx.font='bold 40px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';const txt=segs[i]||'';if(txt.startsWith('data:image')){const img=new Image();img.src=txt;ctx.drawImage(img,-30,-30,60,60);}else{ctx.fillText(txt,0,0);}ctx.restore()}ctx.beginPath();ctx.arc(250,250,35,0,2*Math.PI);ctx.fillStyle='#0c1319';ctx.fill();ctx.beginPath();ctx.arc(250,250,15,0,2*Math.PI);ctx.fillStyle='${themeColor}';ctx.fill();}draw();window.addEventListener('message',(e)=>{if(e.data?.type==='START_GAME'){if(isPlaying)return;isPlaying=true;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'spin'},'*');statusEl.textContent='Spinning...';statusEl.style.color='white';const spins=5;const extraRot=Math.random()*360;currentRot+=spins*360+extraRot;canvas.style.transform=\`rotate(\${-currentRot}deg)\`;setTimeout(()=>{const finalRot=currentRot%360;const n=segs.length;const arcDeg=360/n;const landedIdx=Math.floor(finalRot/arcDeg);const wonTxt=segs[segs.length - 1 - landedIdx];const win=wonTxt!=='1x'&&wonTxt!=='0.5x'&&wonTxt!=='LOSS'&&wonTxt!=='LOSE'&&wonTxt!=='0x';statusEl.textContent=win?'WIN!':'Better luck!';statusEl.style.color=win?'${themeColor}':'#ef4444';isPlaying=false;const mMatch=wonTxt&&typeof wonTxt==='string'?wonTxt.match(/([0-9.]+)x/):null;const mult=mMatch?parseFloat(mMatch[1]):(win?2.0:0);window.parent.postMessage({type:'GAME_RESULT',win,multiplier:mult},'*');},3000);}});window.parent.postMessage({type:'GAME_READY'},'*');setTimeout(()=>{draw();},500);</script></body></html>`;
        } else {
        }

        generatedHtml = generatedHtml
            .replace('isPlaying = true;\n        resultEl.innerHTML = "Spinning...";', 'isPlaying = true;\n        if(window.parent)window.parent.postMessage({type:"PLAY_SOUND",soundType:"spin"},"*");\n        resultEl.innerHTML = "Spinning...";')
            .replace("isPlaying=true;crashed=false;", "isPlaying=true;crashed=false;")
            .replace("isPlaying=true;statusEl.textContent='Rolling...';", "isPlaying=true;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'tumble'},'*');statusEl.textContent='Rolling...';")
            .replace("if(board[i]==='bomb'){cell.className='cell bomb disabled';", "if(board[i]==='bomb'){if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'boom'},'*');cell.className='cell bomb disabled';")
            .replace("}else{cell.className='cell revealed disabled';", "}else{if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'blip'},'*');cell.className='cell revealed disabled';")
            .replace("let move=Math.random()>0.5?1:-1;pos+=move;", "let move=Math.random()>0.5?1:-1;pos+=move;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'blip'},'*');")
            .replace("isPlaying=true;statusEl.textContent='Spinning...';", "isPlaying=true;if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'spin'},'*');statusEl.textContent='Spinning...';")
            .replace("document.getElementById('status').textContent='Simulating...';", "if(window.parent)window.parent.postMessage({type:'PLAY_SOUND',soundType:'tumble'},'*');document.getElementById('status').textContent='Simulating...';");

        return generatedHtml;
    };



    const handlePublish = () => {
        const finalHtml = creationMode === 'template' ? getGeneratedTemplateHtml() : htmlCode;

        if (!gameName.trim() || !finalHtml) {
            alert("Please provide a Game Name and generate a game before publishing.");
            return;
        }

        if (!coverImage) {
            alert("Vă rugăm să încărcați un banner (imagine de copertă) înainte de a posta jocul.");
            return;
        }

        const existingGamesStr = localStorage.getItem('custom_published_games');
        const existingGames = existingGamesStr ? JSON.parse(existingGamesStr) : [];
        if (existingGames.some((g: any) => g.name.toLowerCase() === gameName.trim().toLowerCase())) {
            alert("Există deja un joc postat cu acest nume. Vă rugăm să alegeți un nume unic.");
            return;
        }

        setIsPublishing(true);

        setTimeout(() => {
            const newGame = {
                id: (creationMode === 'template' ? 'tpl_game_' : 'ai_game_') + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                creatorId: creatorData.id || creatorData.name,
                creatorName: creatorData.name,
                type: creationMode === 'template' ? 'manual_template' : 'ai_generated',
                name: gameName,
                coverImage: coverImage || null,
                themeEmoji: themeEmoji,
                themeColor: themeColor,
                htmlCode: finalHtml,
                winEffect: winEffect,
                winSound: winSound,
                publishedAt: new Date().toISOString()
            };

            const existingGamesStr = localStorage.getItem('custom_published_games');
            const existingGames = existingGamesStr ? JSON.parse(existingGamesStr) : [];
            localStorage.setItem('custom_published_games', JSON.stringify([newGame, ...existingGames]));

            // Trigger storage event so lobby refreshes immediately
            window.dispatchEvent(new Event('storage'));

            // Update local state
            setPublishedGames(prev => [newGame, ...prev]);

            setIsPublishing(false);
            setIsSuccess(true);

            setTimeout(() => {
                // Reset form for next game
                setAiPrompt('');
                setGameName('');
                setGameDescription('');
                setThemeEmoji('');
                setThemeColor('#a855f7');
                setHtmlCode('');
                setCoverImage(null);
                setShowPreview(false);
                setIsSuccess(false);
            }, 2500);
        }, 1500);
    };

    // Using srcDoc on the iframe directly instead of data URI to preserve origin

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-6"
        >
            <div className="bg-[#0b1622]/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                                <Sparkles size={24} />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">AI Game Studio</h2>
                        </div>
                        <p className="text-slate-400 font-medium">Describe any game idea and AI will build it from scratch — unique code, unique mechanics, unique visuals.</p>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border-2 border-green-500/50">
                            <Check size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Game Published!</h3>
                        <p className="text-slate-400 max-w-md">Your AI-crafted game is now live in the Casino Lobby. Players can play it and you&apos;ll earn a cut!</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* MY PUBLISHED GAMES */}
                        {publishedGames.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Gamepad2 size={16} className="text-[#00b9f0]" />
                                    My Published Games
                                    <span className="ml-auto text-xs text-slate-500 font-mono">{publishedGames.length} game{publishedGames.length !== 1 ? 's' : ''}</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {publishedGames.map((game: any) => (
                                        <motion.div
                                            key={game.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group relative bg-[#0a111a] rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
                                            style={{ boxShadow: `0 0 0 0 transparent`, borderColor: undefined }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${game.themeColor || '#a855f7'}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${game.themeColor || '#a855f7'}20`; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                                        >
                                            {/* Cover */}
                                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                                <div className="absolute inset-0 bg-[#152a3a] overflow-hidden">
                                                    {game.coverImage ? (
                                                        <img src={game.coverImage} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" style={{ display: 'block' }} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-5xl">{game.themeEmoji || '🎮'}</div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a111a] via-transparent to-transparent pointer-events-none" />
                                                    
                                                    {/* Status badge */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30 backdrop-blur-sm">
                                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                        LIVE
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-white font-black text-sm truncate">{game.name}</h4>
                                                </div>
                                                <p className="text-slate-500 text-[11px] truncate mb-3">{game.gameDescription || 'AI-generated game'}</p>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                        <Clock size={10} />
                                                        {new Date(game.publishedAt).toLocaleDateString()}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this game? It will be removed from the lobby.')) {
                                                                deleteGame(game.id);
                                                            }
                                                        }}
                                                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CREATION MODE TOGGLE */}
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 w-fit">
                            <button
                                onClick={() => { setCreationMode('ai'); setShowPreview(false); setHtmlCode(''); }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${creationMode === 'ai' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Sparkles size={16} />
                                AI Game Creator
                            </button>
                            <button
                                onClick={() => { setCreationMode('template'); setShowPreview(false); setHtmlCode(''); }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${creationMode === 'template' ? 'bg-[#152a3a] border border-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutTemplate size={16} />
                                Manual Templates
                            </button>
                        </div>

                        {/* STEP 1: Builder */}
                        <div>
                            {creationMode === 'ai' ? (
                                <>
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-[10px] font-black text-fuchsia-400">1</span>
                                        Describe Your Game
                                    </h3>

                            <div className="relative bg-gradient-to-b from-[#1a1025] to-[#0a141d] rounded-2xl p-6 border border-fuchsia-500/20 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-screen rounded-2xl"></div>

                                <div className="flex items-start gap-4 relative z-10">
                                    <Bot className="w-10 h-10 text-fuchsia-400 shrink-0 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <p className="text-white font-bold mb-1">What kind of game do you want to create?</p>
                                            <p className="text-slate-500 text-xs">Be specific! Describe the theme, mechanics, difficulty, and visual style you want.</p>
                                        </div>

                                        <textarea
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="e.g. 'A space-themed dice game where you roll cosmic dice and match constellation symbols. High risk, high reward with up to 50x multipliers. Neon purple and blue color scheme.'"
                                            className="w-full h-28 bg-black/40 border border-fuchsia-500/30 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 resize-none transition-all text-sm"
                                        />

                                        {/* IMAGE UPLOAD UI */}
                                        <div className="flex flex-col gap-2 border border-white/5 rounded-xl p-3 bg-black/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest"><ImageIcon size={14} className="inline mr-1"/> Upload Assets (Optional)</span>
                                                <label className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-3 py-1 rounded-lg cursor-pointer hover:bg-fuchsia-500/30 transition-colors font-bold flex items-center gap-1">
                                                    <Upload size={14} /> Add Image
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleAiImageUpload} />
                                                </label>
                                            </div>
                                            {aiImages.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-white/10">
                                                    {aiImages.map((img, idx) => (
                                                        <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 border border-white/10 group">
                                                            <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button onClick={() => removeAiImage(idx)} className="text-red-400 hover:text-red-300 bg-red-500/20 p-1 rounded">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {generationError && (
                                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                                <AlertTriangle size={14} />
                                                {generationError}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleAIGenerate()}
                                            disabled={isGenerating || !aiPrompt.trim()}
                                            className={`py-3 px-8 rounded-xl font-bold flex items-center gap-2 transition-all ${isGenerating || !aiPrompt.trim() ? 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(217,70,239,0.4)]'}`}
                                        >
                                            {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Generating Game Code...</> : verificationStatus === 'verifying' ? <><Loader2 className="animate-spin" size={18} /> Verifying Game...</> : verificationStatus === 'retrying' ? <><Loader2 className="animate-spin" size={18} /> Retrying ({aiRetryCount}/3)...</> : <><Wand2 size={18} /> Generate Game</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">1</span>
                                        Visual Editor
                                    </h3>

                                    <div className="relative bg-[#0d1821] rounded-2xl p-6 lg:p-10 border border-white/10 flex flex-col items-center">
                                        
                                        {/* Editor Toolbar */}
                                        <div className="w-full max-w-2xl bg-black/40 rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4 mb-10 shadow-lg">
                                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full pb-2 scrollbar-thin scrollbar-thumb-white/10">
                                                {['slot', 'crash', 'dice', 'mines', 'plinko', 'wheel'].map((temp) => (
                                                    <button
                                                        key={temp}
                                                        onClick={() => setSelectedTemplate(temp)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${selectedTemplate === temp ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {temp === 'slot' && <LayoutTemplate size={14} />}
                                                        {temp === 'crash' && <Play size={14} />}
                                                        {['dice', 'mines', 'plinko', 'wheel'].includes(temp) && <Gamepad2 size={14} />}
                                                        {temp}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest"><Palette size={14} className="inline mr-1"/> Color</span>
                                                    <input
                                                        type="color"
                                                        value={themeColor}
                                                        onChange={(e) => setThemeColor(e.target.value)}
                                                        className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Visual Canvas - REAL IN-GAME PREVIEW */}
                                        <div className="w-full max-w-5xl relative perspective-1000 mt-8">
                                            
                                            <div className="text-center mb-6">
                                                <h4 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">In-Game LIVE Editor</h4>
                                                <p className="text-sm text-[#00b9f0] font-bold">CLICK direct pe elementele de mai jos din joc pentru a le personaliza!</p>
                                            </div>

                                            <div 
                                                className="bg-[#0f212e] rounded-2xl w-full border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] relative transition-all duration-500"
                                                style={{ boxShadow: `0 0 50px ${themeColor}30`, borderColor: `${themeColor}50` }}
                                            >
                                                {/* LEFT PANEL (Editor) */}
                                                <div className="w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 z-20 relative overflow-y-auto">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div 
                                                            className="flex flex-col gap-1 text-white cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-xl transition-colors group/item relative w-full"
                                                            onClick={() => setEditingField('name')}
                                                        >
                                                            {editingField === 'name' ? (
                                                                <input autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} value={gameName} onChange={(e) => setGameName(e.target.value)} className="w-full text-xl font-black uppercase tracking-widest bg-black/50 border border-blue-400 rounded px-2" />
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate">{gameName}</h2>
                                                                    </div>
                                                                    <p className="text-[10px] uppercase tracking-widest truncate" style={{ color: themeColor }}>By Playforges Creator</p>
                                                                    <div className="absolute top-1 right-2 opacity-0 group-hover/item:opacity-100"><span className="text-[10px] bg-black px-1 rounded text-white font-bold">Edit Title</span></div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description editor */}
                                                    <div className="mt-1">
                                                        <input
                                                            type="text"
                                                            value={gameDescription}
                                                            onChange={(e) => setGameDescription(e.target.value)}
                                                            placeholder="Game description..."
                                                            className="w-full bg-transparent border-b border-white/10 focus:border-blue-400 px-1 py-1 text-xs text-slate-400 italic focus:text-white focus:outline-none transition-colors placeholder:text-slate-600"
                                                        />
                                                    </div>

                                                    {/* Game Background & Effect Settings */}
                                                    <div className="bg-gradient-to-br from-[#0a1114] to-[#121c22] border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] rounded-2xl p-4 flex flex-col gap-4 mt-6 shrink-0 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                                        
                                                        <div className="flex flex-col gap-2 relative z-10">
                                                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
                                                                <ImageIcon size={16} className="text-blue-400" />
                                                                <label className="text-xs font-black text-white uppercase tracking-widest">Atmosphere & Background</label>
                                                            </div>
                                                            <label className="flex items-center justify-center gap-2 bg-black/40 rounded-xl h-24 border border-dashed border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                                {gameBackgroundImage ? (
                                                                    <>
                                                                       <img src={gameBackgroundImage} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                                       <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                                                                       <span className="relative z-10 text-xs text-white font-bold bg-blue-500/80 px-4 py-2 rounded-lg backdrop-blur shadow-lg shadow-blue-500/20 border border-white/20">Change Background</span>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                                            <Upload size={14} />
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-400 font-bold group-hover:text-white transition-colors">Upload Game Background (Max 5MB)</span>
                                                                    </div>
                                                                )}
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setGameBackgroundImage)} />
                                                            </label>
                                                            {gameBackgroundImage && (
                                                                <button className="text-[10px] text-slate-500 hover:text-red-400 hover:underline text-right transition-colors" onClick={() => setGameBackgroundImage(null)}>Remove Background</button>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-3 relative z-10 mt-2">
                                                            <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-2 gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                                                                    <label className="text-xs font-black text-white uppercase tracking-widest leading-none">Victory Celebration</label>
                                                                </div>
                                                                <label className={`text-[10px] flex-shrink-0 font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border shadow-lg ${winSound ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400'}`}>
                                                                    <span className="flex items-center gap-1.5 break-normal whitespace-nowrap">
                                                                        <Volume2 size={12} />
                                                                        {winSound ? 'Audio Loaded' : 'Add Sound (.mp3)'}
                                                                    </span>
                                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setWinSound)} />
                                                                </label>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {WIN_EFFECTS.map(effect => (
                                                                    <button
                                                                        key={effect.id}
                                                                        onClick={() => setWinEffect(effect.id)}
                                                                        className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 relative overflow-hidden group ${winEffect === effect.id ? 'bg-gradient-to-b from-blue-500/20 to-blue-600/10 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                                                                    >
                                                                        {winEffect === effect.id && <div className="absolute inset-0 bg-blue-400/10 opacity-50 blur-md pointer-events-none"></div>}
                                                                        <span className={`text-2xl mb-1 transition-transform duration-300 ${winEffect === effect.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 opacity-70'} grayscale-0`}>{effect.icon}</span>
                                                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${winEffect === effect.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{effect.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {winSound && (
                                                                <button className="text-[10px] text-slate-500 hover:text-red-400 hover:underline text-right mt-1 transition-colors" onClick={() => setWinSound(null)}>Remove Audio Track</button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* PAYOUTS / SYMBOLS EDITOR (Only for slot) */}
                                                    {selectedTemplate === 'slot' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4 relative group/payouts">
                                                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payouts & Symbols</span>
                                                                <span className="text-[10px] text-blue-400 font-bold opacity-0 group-hover/payouts:opacity-100 transition-opacity">Click icon to change</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 h-32 overflow-y-auto">
                                                                {slotSymbols.map((sym, i) => (
                                                                    <label key={i} className="flex justify-between items-center bg-[#121c22] rounded px-2 py-1 h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer transition-colors relative group/sym">
                                                                        <span className="text-2xl leading-none flex items-center justify-center w-8 h-8 rounded shrink-0 drop-shadow">
                                                                            {sym.startsWith('data:image') ? <img src={sym} className="w-full h-full object-contain" alt="symbol" /> : sym}
                                                                        </span>
                                                                        <span className="font-mono text-[10px] sm:text-xs font-bold" style={{ color: themeColor }}>{(i+1)*2}x</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/sym:opacity-100 rounded z-10 text-center"><span className="text-[9px] text-white font-bold leading-tight">Upload<br/>Image</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{
                                                                             const file = e.target.files?.[0];
                                                                             if (file) {
                                                                                 const reader = new FileReader();
                                                                                 reader.onload = () => {
                                                                                     const img = new Image();
                                                                                     img.onload = () => {
                                                                                         const canvas = document.createElement('canvas');
                                                                                         const MAX_SIZE = 120;
                                                                                         let width = img.width; let height = img.height;
                                                                                         if(width>height){if(width>MAX_SIZE){height*=MAX_SIZE/width;width=MAX_SIZE;}}
                                                                                         else{if(height>MAX_SIZE){width*=MAX_SIZE/height;height=MAX_SIZE;}}
                                                                                         canvas.width = width; canvas.height = height;
                                                                                         const ctx = canvas.getContext('2d');
                                                                                         ctx?.drawImage(img, 0, 0, width, height);
                                                                                         const resizedDataUrl = canvas.toDataURL('image/webp', 0.8);
                                                                                         const newSyms = [...slotSymbols];
                                                                                         newSyms[i] = resizedDataUrl;
                                                                                         setSlotSymbols(newSyms);
                                                                                     };
                                                                                     img.src = reader.result as string;
                                                                                 };
                                                                                 reader.readAsDataURL(file);
                                                                             }
                                                                        }} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ICON EDITORS FOR OTHER TEMPLATES */}
                                                    {selectedTemplate === 'crash' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Crash Icons</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {crashIcons.map((icon, i) => (
                                                                    <label key={i} className="flex items-center gap-2 bg-[#121c22] rounded px-2 py-2 h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer relative group/ic">
                                                                        <span className="text-2xl w-8 h-8 flex items-center justify-center">{icon.startsWith('data:image') ? <img src={icon} className="w-full h-full object-contain" alt="" /> : icon}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold">{i===0?'Ship':'Crash'}</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/ic:opacity-100 rounded z-10"><span className="text-[9px] text-white font-bold">Upload</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{const newArr=[...crashIcons];newArr[i]=r.result as string;setCrashIcons(newArr)};r.readAsDataURL(f)}}} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'dice' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Dice Faces</span>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {diceIcons.map((icon, i) => (
                                                                    <label key={i} className="flex items-center justify-center bg-[#121c22] rounded h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer relative group/ic">
                                                                        <span className="text-2xl">{icon.startsWith('data:image') ? <img src={icon} className="w-8 h-8 object-contain" alt="" /> : icon}</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/ic:opacity-100 rounded z-10"><span className="text-[9px] text-white font-bold">Upload</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{const newArr=[...diceIcons];newArr[i]=r.result as string;setDiceIcons(newArr)};r.readAsDataURL(f)}}} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'mines' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Mine Icons</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {minesIcons.map((icon, i) => (
                                                                    <label key={i} className="flex items-center gap-2 bg-[#121c22] rounded px-2 py-2 h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer relative group/ic">
                                                                        <span className="text-2xl w-8 h-8 flex items-center justify-center">{icon.startsWith('data:image') ? <img src={icon} className="w-full h-full object-contain" alt="" /> : icon}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold">{i===0?'Gem':'Bomb'}</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/ic:opacity-100 rounded z-10"><span className="text-[9px] text-white font-bold">Upload</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{const newArr=[...minesIcons];newArr[i]=r.result as string;setMinesIcons(newArr)};r.readAsDataURL(f)}}} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'plinko' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Plinko Icons</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {plinkoIcons.map((icon, i) => (
                                                                    <label key={i} className="flex items-center gap-2 bg-[#121c22] rounded px-2 py-2 h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer relative group/ic">
                                                                        <span className="text-2xl w-8 h-8 flex items-center justify-center">{icon.startsWith('data:image') ? <img src={icon} className="w-full h-full object-contain" alt="" /> : icon}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold">{i===0?'Ball':'Peg'}</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/ic:opacity-100 rounded z-10"><span className="text-[9px] text-white font-bold">Upload</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{const newArr=[...plinkoIcons];newArr[i]=r.result as string;setPlinkoIcons(newArr)};r.readAsDataURL(f)}}} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'wheel' && (
                                                        <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-4">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">Wheel Segments</span>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {wheelIcons.map((icon, i) => (
                                                                    <label key={i} className="flex items-center justify-center bg-[#121c22] rounded h-12 border border-white/5 hover:border-blue-400/50 cursor-pointer relative group/ic">
                                                                        <span className="text-2xl">{icon.startsWith('data:image') ? <img src={icon} className="w-8 h-8 object-contain" alt="" /> : icon}</span>
                                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover/ic:opacity-100 rounded z-10"><span className="text-[9px] text-white font-bold">Upload</span></div>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>{const newArr=[...wheelIcons];newArr[i]=r.result as string;setWheelIcons(newArr)};r.readAsDataURL(f)}}} />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-auto relative group/spin shrink-0">
                                                        <button className={`w-full text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg hover:brightness-110 relative overflow-hidden`} style={{ background: `linear-gradient(to right, ${themeColor}, ${themeColor}aa)` }}>
                                                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                                                {(selectedTemplate === 'slot' || selectedTemplate === 'wheel') ? <><Play size={20} fill="currentColor" /> SPIN</> : <><Play size={20} fill="currentColor" /> PLAY</>}
                                                            </span>
                                                        </button>
                                                        <div className="absolute -top-3 -right-3 cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md opacity-0 group-hover/spin:opacity-100 transition-opacity z-30" onClick={() => { document.getElementById('color-picker-trigger')?.click(); }}>
                                                            <Palette size={14} className="text-white"/>
                                                        </div>
                                                        <input id="color-picker-trigger" type="color" className="hidden" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* GAME AREA — Visual Preview */}
                                                <div 
                                                    className="flex-1 relative bg-[#06090c] p-4 flex flex-col items-center justify-center overflow-hidden"
                                                    style={{ backgroundImage: gameBackgroundImage ? `url('${gameBackgroundImage}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                                >
                                                    {gameBackgroundImage && <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>}
                                                    {gameDescription && (
                                                        <div 
                                                            className="absolute top-4 inset-x-0 mx-auto text-center px-8 z-10 cursor-pointer group/desc"
                                                            onClick={() => setEditingField('desc')}
                                                        >
                                                            {editingField === 'desc' ? (
                                                                <textarea autoFocus onBlur={() => setEditingField(null)} value={gameDescription} onChange={(e) => setGameDescription(e.target.value)} className="w-full max-w-md h-16 bg-black/60 text-slate-300 text-sm italic rounded-xl px-4 py-2 border border-blue-400 focus:outline-none resize-none mx-auto text-center" />
                                                            ) : (
                                                                <p className="text-slate-400 text-sm italic max-w-md mx-auto hover:text-white transition-colors">{gameDescription}</p>
                                                            )}
                                                            <span className="text-[10px] bg-black/80 text-white font-bold px-2 py-1 rounded absolute -top-4 opacity-0 group-hover/desc:opacity-100 left-1/2 -translate-x-1/2">Edit Description</span>
                                                        </div>
                                                    )}

                                                    {/* TEMPLATE VISUALS */}
                                                    {selectedTemplate === 'slot' && (
                                                        <div className="relative p-6 lg:p-10 rounded-3xl border-8 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500" style={{ background: `linear-gradient(to bottom, ${themeColor}40, #0a1114)`, borderColor: `${themeColor}20` }}>
                                                            <div className="flex gap-4 sm:gap-6 bg-[#06090c] p-4 sm:p-6 rounded-2xl shadow-inner border-[4px] border-[#0f171c]">
                                                                {[0,1,2].map((i) => (
                                                                    <div key={i} className="w-28 h-40 sm:w-36 sm:h-52 bg-[#121c22] rounded-xl overflow-hidden relative border border-white/5 shadow-inner">
                                                                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-10 pointer-events-none"></div>
                                                                        <div className="flex flex-col items-center justify-center w-full h-full text-[80px] sm:text-[110px] absolute inset-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                                            {slotSymbols[i % slotSymbols.length].startsWith('data:image') ? <img src={slotSymbols[i % slotSymbols.length]} className="w-3/4 h-3/4 object-contain" /> : slotSymbols[i % slotSymbols.length]}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'crash' && (
                                                        <div className="w-full max-w-2xl h-[300px] border-l-4 border-b-4 relative flex items-end ml-12" style={{ borderColor: `${themeColor}50` }}>
                                                            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 preserve-3d overflow-visible" preserveAspectRatio="none">
                                                                 <path d="M0,100 Q40,90 90,10" fill="none" stroke={themeColor} strokeWidth="4" />
                                                            </svg>
                                                            <div className="absolute w-[60px] h-[60px] flex items-center justify-center -translate-x-1/2 translate-y-1/2 z-10" style={{ left: '90%', top: '10%' }}>
                                                                  {crashIcons[0].startsWith('data:image') ? <img src={crashIcons[0]} className="w-full h-full object-contain drop-shadow-xl" alt="" /> : <span className="text-5xl">{crashIcons[0]}</span>}
                                                            </div>
                                                            <div className="absolute text-5xl sm:text-7xl font-black drop-shadow-lg" style={{ color: themeColor, top: '25%', right: '10%' }}>2.14x</div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'dice' && (
                                                        <div className="w-56 h-56 rounded-[40px] border-[6px] flex items-center justify-center text-[100px] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(255,255,255,0.05)] transform rotate-[-5deg]" style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.5))`, borderColor: `${themeColor}50` }}>
                                                            {diceIcons[0] && diceIcons[0].startsWith('data:image') ? <img src={diceIcons[0]} className="w-3/4 h-3/4 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" alt="" /> : <span>{diceIcons[0]}</span>}
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'mines' && (
                                                        <div className="grid grid-cols-5 gap-2 bg-[#0c1319] p-4 rounded-2xl shadow-inner border border-white/5">
                                                            {Array.from({length: 25}).map((_, i) => (
                                                                <div key={i} className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg transition-colors cursor-pointer" style={{ backgroundColor: i===12 ? `${themeColor}40` : `${themeColor}20`, boxShadow: i===12 ? `0 0 15px ${themeColor}40` : 'none' }}>
                                                                    {i===12 && <div className="w-full h-full flex items-center justify-center drop-shadow-lg text-2xl">
                                                                        {minesIcons[0] && minesIcons[0].startsWith('data:image') ? <img src={minesIcons[0]} className="w-3/4 h-3/4 object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" alt="" /> : minesIcons[0]}
                                                                    </div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'plinko' && (
                                                        <div className="flex flex-col items-center gap-3">
                                                            {[1,2,3,4,5,6,7,8].map(row => (
                                                                <div key={row} className="flex gap-6">
                                                                     {Array.from({length: row}).map((_, i) => (
                                                                         <div key={`${row}-${i}`} className="w-3 h-3 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>
                                                                     ))}
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-2.5 mt-4">
                                                                 {[10,5,2,1,0.5,1,2,5,10].map((m, i) => (
                                                                     <div key={i} className="px-3 py-1.5 text-xs font-black rounded-lg shadow-lg" style={{ backgroundColor: `${themeColor}40`, color: themeColor }}>{m}x</div>
                                                                 ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedTemplate === 'wheel' && (
                                                        <div 
                                                            className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-[12px] border-[#0c1319] relative shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden" 
                                                            style={{ 
                                                                background: `conic-gradient(${
                                                                    wheelIcons.map((_, i) => {
                                                                        const start = (i * 360) / wheelIcons.length;
                                                                        const end = ((i + 1) * 360) / wheelIcons.length;
                                                                        const color = i % 2 === 0 ? themeColor : '#1e293b';
                                                                        return `${color} ${start}deg ${end}deg`;
                                                                    }).join(', ')
                                                                })`
                                                            }}
                                                        >
                                                            {wheelIcons.map((icon, i) => {
                                                                const rot = (i + 0.5) * (360 / wheelIcons.length);
                                                                return (
                                                                    <div key={i} className="absolute inset-0 flex items-start justify-center pointer-events-none z-10" style={{ transform: `rotate(${rot}deg)` }}>
                                                                         <div className="pt-6 sm:pt-10 font-bold text-white text-xl sm:text-2xl drop-shadow-md flex items-center justify-center" style={{ transform: 'none' }}>
                                                                              {icon && icon.startsWith('data:image') ? <img src={icon} className="w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow" alt="" /> : icon}
                                                                         </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-8 bg-white shrink-0 shadow-xl z-20" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                                                            <div className="absolute inset-0 m-auto w-16 h-16 bg-[#0c1319] rounded-full border-[6px] border-white/10 flex items-center justify-center shadow-inner z-30">
                                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fallback for others */}
                                                    {!['slot', 'crash', 'dice', 'mines', 'plinko', 'wheel'].includes(selectedTemplate) && (
                                                        <div className="text-center group relative cursor-pointer" onClick={() => setEditingField('name')}>
                                                            <h3 className="text-6xl font-black text-white z-10 mb-4" style={{ textShadow: `0 0 30px ${themeColor}` }}>{themeEmoji}</h3>
                                                            <div className="px-6 py-2 rounded-full text-sm font-bold text-white uppercase tracking-widest border border-white/20" style={{ backgroundColor: `${themeColor}50` }}>
                                                                {selectedTemplate} GAME
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium mt-6 tracking-wide uppercase">Click on text/emoji to edit</p>

                                        <div className="w-full max-w-sm mt-8 border-t border-white/10 pt-8 space-y-4">
                                            {/* Cover Image Upload */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lobby Cover Image (Optional)</label>
                                                <button className="relative w-full aspect-video rounded-xl bg-[#0a111a] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 group transition-all text-center">
                                                    {coverImage ? (
                                                        <>
                                                            <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change Image</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon size={24} className="text-slate-500 group-hover:text-blue-400 mb-1 transition-colors" />
                                                            <span className="text-xs text-slate-400 font-bold">Upload Cover</span>
                                                            <span className="text-[10px] text-red-400/80 mt-1 font-bold">Obligatoriu pentru postare</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, setCoverImage)} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={handlePublish}
                                                disabled={isPublishing || !gameName.trim()}
                                                className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all shadow-xl hover:-translate-y-1 hover:brightness-110 flex items-center justify-center gap-2 ${isPublishing ? 'opacity-60 pointer-events-none' : ''}`}
                                                style={{ backgroundColor: themeColor, boxShadow: `0 5px 25px ${themeColor}40`, color: 'white' }}
                                            >
                                                {isPublishing ? (
                                                    <><Loader2 className="animate-spin" size={20} /> Publishing...</>
                                                ) : (
                                                    <><Save size={20} /> Publish to Lobby</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* STEP 2: Preview & Customize (appears after generation) */}
                        <AnimatePresence>
                            {showPreview && htmlCode && creationMode === 'ai' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-black text-green-400">2</span>
                                        Preview & Customize
                                    </h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Live Preview */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Eye size={14} /> Live Preview
                                                </span>
                                                <button
                                                    onClick={() => { setShowPreview(false); setHtmlCode(''); setGameName(''); }}
                                                    className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <RotateCcw size={12} /> Regenerate
                                                </button>
                                            </div>
                                            <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[400px] relative">
                                                <iframe
                                                    ref={iframeRef}
                                                    srcDoc={htmlCode}
                                                    className="w-full h-full border-0"
                                                    sandbox="allow-scripts"
                                                    title="Game Preview"
                                                />
                                            </div>
                                            
                                            {/* TEST CONTROLS */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'START_GAME', bet: 10 }, '*')}
                                                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/10"
                                                >
                                                    <Play size={16} /> Test Spin
                                                </button>
                                                <button
                                                    onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*')}
                                                    className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/10"
                                                >
                                                    <RotateCcw size={16} /> Reset
                                                </button>
                                            </div>
                                        </div>

                                        {/* Settings */}
                                        <div className="space-y-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Game Details</span>

                                            {/* Game Name */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Game Title</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={gameName}
                                                        onChange={(e) => setGameName(e.target.value)}
                                                        placeholder="Enter a catchy name..."
                                                        className="flex-1 bg-[#0a111a] border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-fuchsia-400 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                                <input
                                                    type="text"
                                                    value={gameDescription}
                                                    onChange={(e) => setGameDescription(e.target.value)}
                                                    placeholder="Short description..."
                                                    className="w-full bg-[#0a111a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fuchsia-400 transition-colors"
                                                />
                                            </div>

                                            {/* Theme Color */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accent Color</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={themeColor}
                                                        onChange={(e) => setThemeColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                                                    />
                                                    <span className="text-white font-mono text-sm">{themeColor}</span>
                                                    <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${themeColor}00, ${themeColor})` }}></div>
                                                </div>
                                            </div>

                                            {/* AI Custom Assets */}
                                            {aiCustomAssets.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                                                    <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles size={14} /> Replace Game Elements
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                                        {aiCustomAssets.map(asset => (
                                                            <div key={asset.id} className="flex flex-col gap-1">
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">{asset.name}</span>
                                                                <label className="flex items-center justify-center bg-[#0a111a] border border-white/10 hover:border-blue-400 flex-1 min-h-[60px] rounded-lg cursor-pointer transition-colors relative overflow-hidden group/asset">
                                                                    {asset.current === asset.default ? (
                                                                        <span className="text-3xl relative z-10">{asset.current}</span>
                                                                    ) : (
                                                                        <img src={asset.current} className="w-10 h-10 object-contain drop-shadow" alt={asset.name} />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover/asset:opacity-100 transition-opacity"></div>
                                                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 flex justify-center py-1 translate-y-full group-hover/asset:translate-y-0 transition-transform">
                                                                        <span className="text-[9px] font-bold text-white uppercase flex items-center gap-1"><Upload size={10} /> Upload</span>
                                                                    </div>
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = () => {
                                                                                const img = new Image();
                                                                                img.onload = () => {
                                                                                    const canvas = document.createElement('canvas');
                                                                                    const MAX = 120;
                                                                                    let w = img.width, h = img.height;
                                                                                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                                                                                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                                                                                    canvas.width = w; canvas.height = h;
                                                                                    const ctx = canvas.getContext('2d');
                                                                                    ctx?.drawImage(img, 0, 0, w, h);
                                                                                    updateCustomAsset(asset.id, canvas.toDataURL('image/webp', 0.8));
                                                                                };
                                                                                img.src = reader.result as string;
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }} />
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cover Image */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lobby Cover Image</label>
                                                <button className="relative w-full aspect-video rounded-xl bg-[#0a111a] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-fuchsia-400 group transition-all text-center">
                                                    {coverImage ? (
                                                        <>
                                                            <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change Image</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon size={32} className="text-slate-500 group-hover:text-fuchsia-400 mb-2 transition-colors" />
                                                            <span className="text-sm text-slate-300 font-bold">Upload Cover</span>
                                                            <span className="text-[10px] text-red-500 mt-1 font-bold">Obligatoriu pentru postare</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, setCoverImage)} />
                                                </button>
                                            </div>

                                            {/* Winning Celebration (AI Mod) */}
                                            <div className="bg-gradient-to-br from-[#0a111a] to-[#160b1e] border border-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.1)] rounded-2xl p-4 flex flex-col gap-3 mt-4 shrink-0 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                                <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-2 relative z-10 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                                                        <label className="text-xs font-black text-white uppercase tracking-widest leading-none">Victory Celebration</label>
                                                    </div>
                                                    <label className={`text-[10px] flex-shrink-0 font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border shadow-lg ${winSound ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/20 hover:border-fuchsia-400'}`}>
                                                        <span className="flex items-center gap-1.5 break-normal whitespace-nowrap">
                                                            <Volume2 size={12} />
                                                            {winSound ? 'Audio Loaded' : 'Add Sound (.mp3)'}
                                                        </span>
                                                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setWinSound)} />
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 relative z-10">
                                                    {WIN_EFFECTS.map(effect => (
                                                        <button
                                                            key={effect.id}
                                                            onClick={() => setWinEffect(effect.id)}
                                                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 relative overflow-hidden group ${winEffect === effect.id ? 'bg-gradient-to-b from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                                                        >
                                                            {winEffect === effect.id && <div className="absolute inset-0 bg-fuchsia-400/10 opacity-50 blur-md pointer-events-none"></div>}
                                                            <span className={`text-2xl mb-1 transition-transform duration-300 ${winEffect === effect.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 opacity-70'} grayscale-0`}>{effect.icon}</span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${winEffect === effect.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{effect.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {winSound && (
                                                    <button className="text-[10px] text-slate-500 hover:text-red-400 hover:underline text-right mt-1 transition-colors relative z-10" onClick={() => setWinSound(null)}>Remove Audio Track</button>
                                                )}
                                            </div>

                                            {/* Publish Button */}
                                            <button
                                                onClick={handlePublish}
                                                disabled={isPublishing || !gameName.trim() || !htmlCode}
                                                className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 mt-4
                                                    ${isPublishing || !gameName.trim() || !htmlCode
                                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-white/5'
                                                        : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(217,70,239,0.3)]'
                                                    }`}
                                            >
                                                {isPublishing ? 'Publishing...' : <><Save size={20} /> Publish to Lobby</>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                )}
            </div>
        </motion.div>
    );
}
