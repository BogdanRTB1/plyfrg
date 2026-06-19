/**
 * One-time patch: inject leaderboard UI into game modals.
 * Run: node scripts/patch-leaderboard.mjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "components");

const MODALS = [
    { file: "PlinkoModal.tsx", game: "Plinko", mobileSheet: true },
    { file: "HeistModal.tsx", game: "Heist", mobileSheet: true },
    { file: "InfluencerModal.tsx", game: "Influencer", mobileSheet: true },
    { file: "EscapeModal.tsx", game: "Escape", mobileSheet: true },
    { file: "BombModal.tsx", game: "Defuse", mobileSheet: true },
    { file: "MinesModal.tsx", game: "Mines", mobileSheet: true },
    { file: "SlotsModal.tsx", game: "Slots", mobileSheet: true },
    { file: "BlackjackModal.tsx", game: "Blackjack", mobileSheet: true },
    { file: "RouletteModal.tsx", game: "Roulette", mobileSheet: true },
    { file: "CrashModal.tsx", game: "Crash", mobileSheet: true },
    { file: "SneakModal.tsx", game: "Secret Sneak", mobileSheet: true },
    { file: "DartWheelModal.tsx", game: "Dart Wheel", mobileSheet: true },
    { file: "AviatorModal.tsx", game: "Aviator Influencer", mobileSheet: true },
    { file: "TomatoesModal.tsx", game: "Tomatoes", mobileSheet: false, mobilePanel: true },
    { file: "FootballModal.tsx", game: "Football", mobileSheet: false, mobilePanel: true },
    { file: "GlassBridgeModal.tsx", game: "Glass Bridge", mobileSheet: true },
    { file: "WantedModal.tsx", game: "Wanted", mobileSheet: true },
    { file: "CustomSlotsModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Game"' },
    { file: "CustomPlinkoModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Game"' },
    { file: "CustomMinesModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Mines"' },
    { file: "CustomCrashModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Game"' },
    { file: "CustomScratchModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Scratch"' },
    { file: "CustomWheelModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Wheel"' },
    { file: "CustomCaseModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "Custom Case"' },
    { file: "CustomHiloModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameName || gameConfig?.theme?.gameName || "Hi-Lo"' },
    { file: "AIGameModal.tsx", game: null, mobileSheet: true, gameExpr: 'gameData?.name || "AI Game"' },
];

function gameNameProp(entry) {
    if (entry.gameExpr) return `{${entry.gameExpr}}`;
    return `"${entry.game}"`;
}

function patch(content, entry) {
    if (content.includes("GameLeaderboardModal")) return content;

    if (content.includes('import FavoriteToggle from "./FavoriteToggle";')) {
        content = content.replace(
            'import FavoriteToggle from "./FavoriteToggle";',
            'import FavoriteToggle from "./FavoriteToggle";\nimport GameLeaderboardTrigger from "./GameLeaderboardTrigger";\nimport GameLeaderboardModal from "./GameLeaderboardModal";'
        );
    } else {
        return content;
    }

    if (content.includes("mobileMoreOpen")) {
        content = content.replace(
            "const [mobileMoreOpen, setMobileMoreOpen] = useState(false);",
            "const [mobileMoreOpen, setMobileMoreOpen] = useState(false);\n    const [leaderboardOpen, setLeaderboardOpen] = useState(false);"
        );
    } else if (!content.includes("leaderboardOpen")) {
        content = content.replace(
            /(export default function \w+[^{]*\{)/,
            "$1\n    const [leaderboardOpen, setLeaderboardOpen] = useState(false);"
        );
    }

    if (!content.includes('variant="header"')) {
        content = content.replace(
            /(<FavoriteToggle gameName=\{[^}]+\} \/>|<FavoriteToggle gameName="[^"]+" \/>)/,
            `$1\n                            <GameLeaderboardTrigger variant="header" onClick={() => setLeaderboardOpen(true)} />`
        );
    }

    if (entry.mobileSheet && content.includes(">Done</button>")) {
        content = content.replace(
            /(\s+<button type="button" onClick=\{\(\) => setMobileMoreOpen\(false\)\} className="w-full rounded-xl border border-white\/10 bg-\[#1a2c38\] py-3 text-sm font-bold text-white active:bg-white\/10">Done<\/button>)/,
            `\n                            <GameLeaderboardTrigger variant="mobile-menu" onClick={() => { setLeaderboardOpen(true); setMobileMoreOpen(false); }} />$1`
        );
    }

    if (entry.mobilePanel && !content.includes('variant="mobile-menu"')) {
        content = content.replace(
            /(<div className="mt-auto space-y-3">)/,
            `<GameLeaderboardTrigger variant="mobile-menu" onClick={() => setLeaderboardOpen(true)} />\n\n                    $1`
        );
    }

    const modalLine = `\n            <GameLeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} gameName={${entry.gameExpr || `"${entry.game}"`}} />`;

    if (content.includes("</AnimatePresence>") && content.includes("document.body")) {
        content = content.replace(
            /(\s+<\/AnimatePresence>\s+<\/div>,\s*\n\s*document\.body)/,
            `${modalLine}$1`
        );
    } else if (content.includes("document.body")) {
        content = content.replace(
            /(\s+<\/div>,\s*\n\s*document\.body)/,
            `${modalLine}$1`
        );
    }

    return content;
}

for (const entry of MODALS) {
    const fp = path.join(ROOT, entry.file);
    if (!fs.existsSync(fp)) {
        console.warn("skip missing", entry.file);
        continue;
    }
    const before = fs.readFileSync(fp, "utf8");
    const after = patch(before, entry);
    if (after !== before) {
        fs.writeFileSync(fp, after);
        console.log("patched", entry.file);
    } else {
        console.log("unchanged", entry.file);
    }
}

console.log("done");
