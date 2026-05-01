const fs = require('fs');
const files = [
  'CustomSlotsModal.tsx', 'CustomPlinkoModal.tsx', 'CustomMinesModal.tsx', 'CustomCrashModal.tsx'
];
for(let f of files) {
  let p = './src/components/' + f;
  if(fs.existsSync(p)){
    let c = fs.readFileSync(p, 'utf8');
    
    if (c.includes('const [sessionWagered')) {
        console.log('Skipping', f, 'already patched');
        continue;
    }
    
    // Add sessionWagered vars
    c = c.replace(/const \[lastWin.*?null\);/, match => match + '\n\n    // Session Tracking\n    const [sessionWagered, setSessionWagered] = useState(0);\n    const [sessionPayout, setSessionPayout] = useState(0);');
    
    // Add setSessionWagered
    c = c.replace(/setForgesCoins\(\(.*?\).*?- betAmount\);\s*\}/, match => match + '\n\n        setSessionWagered(prev => prev + betAmount);');
    
    // Add setSessionPayout
    c = c.replace(/setForgesCoins\(\(.*?\).*?\+ winAmount\);\s*\}/g, match => match + '\n\n        setSessionPayout(prev => prev + winAmount);');
    
    // We replace the !isOpen block
    const effectRegex = /useEffect\(\(\) => \{\s*if \(!isOpen\) \{([\s\S]*?)\}\s*\}, \[isOpen\]\);/;
    c = c.replace(effectRegex, (full, inner) => {
        return `useEffect(() => {
        if (!isOpen) {
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: gameData?.name || "Custom Game", 
                        gameImage: gameData?.coverImage || "/images/game-placeholder.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }
${inner}
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData]);`;
    });
    
    fs.writeFileSync(p, c);
    console.log('Patched', f);
  }
}
