const fs = require('fs');
const path = require('path');

const filePath = 'd:\\\\Unity Projects\\\\Playforges\\\\idx-app\\\\src\\\\components\\\\CreatorGameStudio.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const games = [
    { type: 'slots', var: 'coverImage', setter: 'setCoverImage', hover: 'purple-400' },
    { type: 'crash', var: 'crashCoverImage', setter: 'setCrashCoverImage', hover: 'emerald-400' },
    { type: 'scratch', var: 'scratchCoverImage', setter: 'setScratchCoverImage', hover: 'amber-400' },
    { type: 'wheel', var: 'wheelCoverImage', setter: 'setWheelCoverImage', hover: 'rose-400' },
    { type: 'mines', var: 'minesCoverImage', setter: 'setMinesCoverImage', hover: 'orange-400' },
    { type: 'case', var: 'caseCoverImage', setter: 'setCaseCoverImage', hover: 'indigo-400' },
    { type: 'hilo', var: 'hiloCoverImage', setter: 'setHiloCoverImage', hover: 'blue-500' }
];

for (const game of games) {
    // Construct the regex to find the Cover Image block
    const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // The exact structure varies slightly by the hover color and variables.
    // It's safer to capture it dynamically.
    const blockRegex = new RegExp(
        `\\s*<div>\\s*<label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">\\s*Lobby Cover Image <span className="text-red-400">\\*</span>\\s*</label>\\s*<label className="relative w-full aspect-video rounded-xl bg-\\[#0a111a\\] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-[a-z0-9-]+ group cursor-pointer transition-all block">\\s*\\{${game.var} \\? \\(\\s*<>\\s*<img src=\\{${game.var}\\} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />\\s*<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">\\s*<span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change</span>\\s*</div>\\s*</>\\s*\\) : \\(\\s*<>\\s*<ImageIcon size=\\{24\\} className="text-slate-500 group-hover:text-[a-z0-9-]+ mb-1 transition-colors" />\\s*<span className="text-xs text-slate-400 font-bold">Upload Cover</span>\\s*<span className="\\[10px\\] text-red-400/80 mt-1 font-bold">Required to publish</span>\\s*</>\\s*\\)\\}\\s*<input type="file" accept="image/\\*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange=\\{\\(e\\) => handleFileUpload\\(e, ${game.setter}\\)\\} />\\s*</label>\\s*</div>`, 'g');

    // To be safe, just write a simpler regex to match the outer div
    const simplerRegex = new RegExp(
        `[ \\t]*<div>\\s*<label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">\\s*Lobby Cover Image <span className="text-red-400">\\*</span>[\\s\\S]*?<input type="file" accept="image/\\*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange=\\{\\(e\\) => handleFileUpload\\(e, ${game.setter}\\)\\} />\\s*</label>\\s*</div>`
    );

    const match = content.match(simplerRegex);
    if (match) {
        console.log(`Found cover image block for ${game.type}`);
        const blockContent = match[0];
        
        // Remove from current location
        content = content.replace(simplerRegex, '');
        
        // Find the Publish button area in the Preview section for this game
        // Search for: {/* Publish Button */} or the handlePublish button that uses this game's coverImage variable
        
        let publishBtnRegex;
        if (game.type === 'slots') {
             publishBtnRegex = /[ \t]*\{\/\* Publish Button \*\/\}\s*<button\s*onClick=\{handlePublish\}\s*disabled=\{isPublishing \|\| !gameName\.trim\(\) \|\| !coverImage\}/;
        } else if (game.type === 'hilo') {
             publishBtnRegex = /<button\s*onClick=\{handlePublish\}\s*disabled=\{isPublishing \|\| !hiloGameName\.trim\(\) \|\| !hiloCoverImage\}/;
        } else {
             publishBtnRegex = new RegExp(`[ \\t]*\\{\\/\\* Publish Button \\*\\/\\}\\s*<button\\s*onClick=\\{handlePublish\\}\\s*disabled=\\{isPublishing \\|\\| !${game.type}GameName\\.trim\\(\\) \\|\\| !${game.type}CoverImage\\}`);
        }

        const publishMatch = content.match(publishBtnRegex);
        if (publishMatch) {
            console.log(`Found publish button for ${game.type}`);
            // Insert the blockContent right before the publish button
            content = content.replace(publishBtnRegex, blockContent + '\n\n' + publishMatch[0]);
        } else {
            console.log(`Could not find publish button for ${game.type}`);
            // Special handling for slots where it might be slightly different or missing comment
             if (game.type === 'hilo') {
                const hiloPubRegex = /<button\s*onClick=\{handlePublish\}\s*disabled=\{isPublishing \|\| !hiloGameName\.trim\(\) \|\| !hiloCoverImage\}/;
                const hMatch = content.match(hiloPubRegex);
                if (hMatch) {
                    content = content.replace(hiloPubRegex, blockContent + '\n\n' + hMatch[0]);
                }
             }
        }
    } else {
        console.log(`Could not find cover image block for ${game.type}`);
    }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
