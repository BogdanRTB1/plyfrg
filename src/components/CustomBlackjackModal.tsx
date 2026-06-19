"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, MoreHorizontal, Zap } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import GameLeaderboardTrigger from "./GameLeaderboardTrigger";
import GameLeaderboardModal from "./GameLeaderboardModal";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound } from "@/utils/originalGameSounds";
import { applyBlackjackPayout } from "@/utils/originalsMath";
import { scaleDemoWin } from "@/utils/demoPlay";
import { getSharedAudioContext } from "@/utils/gameAudioContext";
import { BlackjackConfig, DEFAULT_BLACKJACK_CONFIG } from "@/types/blackjackConfig";

type Card = {
    suit: "Hearts" | "Diamonds" | "Clubs" | "Spades";
    value: string;
    numValue: number;
    hidden?: boolean;
};

interface CustomBlackjackModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameData?: any;
    diamonds?: number;
    setDiamonds?: (val: any) => void;
    forgesCoins?: number;
    setForgesCoins?: (val: any) => void;
}

function getTableBackground(config: BlackjackConfig): React.CSSProperties {
    const base = config.tableColor;
    if (config.tableFeltPattern === "radial") {
        return {
            background: `radial-gradient(circle at 50% 30%, ${config.accentColor}55 0%, ${base} 55%, ${base}dd 100%)`,
        };
    }
    if (config.tableFeltPattern === "stripes") {
        return {
            backgroundColor: base,
            backgroundImage: `repeating-linear-gradient(135deg, ${config.accentColor}22 0px, ${config.accentColor}22 2px, transparent 2px, transparent 16px)`,
        };
    }
    return { backgroundColor: base };
}

export default function CustomBlackjackModal({
    isOpen,
    onClose,
    gameData,
    diamonds = 0,
    setDiamonds,
    forgesCoins = 0,
    setForgesCoins,
}: CustomBlackjackModalProps) {
    const config: BlackjackConfig = gameData?.blackjackConfig || DEFAULT_BLACKJACK_CONFIG;
    const gameTitle = gameData?.name || config.theme.gameName;

    const [currencyType, setCurrencyType] = useState<"GC" | "FC">("GC");
    const balance = currencyType === "GC" ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number; currency: "GC" | "FC" } | null>(null);
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "DEALER_TURN" | "WON" | "LOST" | "PUSH">("IDLE");
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);

    const dealerTimeoutRef = useRef<number | null>(null);
    const roundIdRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const customAudioRef = useRef<HTMLAudioElement | null>(null);

    const tableStyle = useMemo(() => getTableBackground(config), [config]);

    useEffect(() => {
        if (isOpen) audioCtxRef.current = getSharedAudioContext();
    }, [isOpen]);

    const playConfiguredSound = (kind: "deal" | "win" | "loss") => {
        const soundType =
            kind === "deal" ? config.dealSoundType :
            kind === "win" ? config.winSoundType :
            config.lossSoundType;
        const soundFile =
            kind === "deal" ? config.dealSoundFile :
            kind === "win" ? config.winSoundFile :
            config.lossSoundFile;

        if (soundType === "custom" && soundFile) {
            if (!customAudioRef.current) customAudioRef.current = new Audio(soundFile);
            else customAudioRef.current.src = soundFile;
            customAudioRef.current.currentTime = 0;
            customAudioRef.current.play().catch(() => {});
            return;
        }

        playGameSound("blackjack", kind === "deal" ? "bet" : kind === "win" ? "win" : "lose");
    };

    const drawCard = (): Card => {
        const suits: Card["suit"][] = ["Hearts", "Diamonds", "Clubs", "Spades"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const value = values[Math.floor(Math.random() * values.length)];
        let numValue = parseInt(value, 10);
        if (value === "A") numValue = 11;
        if (["J", "Q", "K"].includes(value)) numValue = 10;
        return { suit, value, numValue };
    };

    const calculateHand = (hand: Card[]) => {
        let total = 0;
        let aces = 0;
        hand.forEach((c) => {
            if (!c.hidden) {
                total += c.numValue;
                if (c.value === "A") aces += 1;
            }
        });
        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }
        return total;
    };

    const getHandTotals = (hand: Card[]) => {
        let total = 0;
        let aces = 0;
        hand.forEach((c) => {
            if (!c.hidden) {
                total += c.numValue;
                if (c.value === "A") aces += 1;
            }
        });
        let acesAsEleven = aces;
        while (total > 21 && acesAsEleven > 0) {
            total -= 10;
            acesAsEleven -= 1;
        }
        return { total, isSoft: acesAsEleven > 0 };
    };

    const clearDealerTimeout = () => {
        if (dealerTimeoutRef.current !== null) {
            window.clearTimeout(dealerTimeoutRef.current);
            dealerTimeoutRef.current = null;
        }
    };

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;
        clearDealerTimeout();
        roundIdRef.current += 1;

        if (currencyType === "GC" && setDiamonds) setDiamonds((prev: number) => prev - betAmount);
        else if (setForgesCoins) setForgesCoins((prev: number) => prev - betAmount);

        setSessionWagered((prev) => prev + betAmount);
        playConfiguredSound("deal");

        const pHand: Card[] = [drawCard(), drawCard()];
        const dHand: Card[] = [drawCard(), { ...drawCard(), hidden: true }];
        setPlayerHand(pHand);
        setDealerHand(dHand);

        if (calculateHand(pHand) === 21) {
            setGameState("WON");
            payOut(2.5);
            setDealerHand(dHand.map((c) => ({ ...c, hidden: false })));
        } else {
            setGameState("PLAYING");
        }
    };

    const hit = () => {
        if (gameState !== "PLAYING") return;
        const pHand = [...playerHand, drawCard()];
        setPlayerHand(pHand);
        playConfiguredSound("deal");

        if (calculateHand(pHand) > 21) {
            playConfiguredSound("loss");
            setGameState("LOST");
            setDealerHand(dealerHand.map((c) => ({ ...c, hidden: false })));
        } else if (calculateHand(pHand) === 21) {
            stand(pHand);
        }
    };

    const stand = (pHand = playerHand) => {
        if (gameState !== "PLAYING") return;
        setGameState("DEALER_TURN");
        clearDealerTimeout();
        const activeRoundId = roundIdRef.current;
        let dHand: Card[] = dealerHand.map((c) => ({ ...c, hidden: false }));

        const playDealer = () => {
            if (activeRoundId !== roundIdRef.current || !isOpen) return;
            const { total: dTotal, isSoft } = getHandTotals(dHand);
            const shouldHit = dTotal < 17 || (dTotal === 17 && isSoft);

            if (shouldHit) {
                dealerTimeoutRef.current = window.setTimeout(() => {
                    if (activeRoundId !== roundIdRef.current || !isOpen) return;
                    dHand = [...dHand, drawCard()];
                    setDealerHand(dHand);
                    playConfiguredSound("deal");
                    playDealer();
                }, 800);
            } else {
                resolveGame(pHand, dHand);
            }
        };

        setDealerHand(dHand);
        playDealer();
    };

    const resolveGame = (pHand: Card[], dHand: Card[]) => {
        const pTotal = calculateHand(pHand);
        const dTotal = calculateHand(dHand);

        if (dTotal > 21 || pTotal > dTotal) {
            setGameState("WON");
            payOut(2);
        } else if (pTotal < dTotal) {
            playConfiguredSound("loss");
            setGameState("LOST");
        } else {
            setGameState("PUSH");
            payOut(1);
        }
    };

    const payOut = (multiplier: number) => {
        const winAmount = scaleDemoWin(applyBlackjackPayout(betAmount, multiplier));
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === "GC" && setDiamonds) setDiamonds((prev: number) => prev + winAmount);
        else if (setForgesCoins) setForgesCoins((prev: number) => prev + winAmount);

        setSessionPayout((prev) => prev + winAmount);

        if (multiplier > 1) {
            playConfiguredSound("win");
            fireWinConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const handleBetChange = (amount: number) => {
        if (gameState === "PLAYING" || gameState === "DEALER_TURN") return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            clearDealerTimeout();
            roundIdRef.current += 1;

            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent("game_session_complete", {
                    detail: {
                        gameName: gameTitle,
                        gameImage: gameData?.coverImage || "/images/game-blackjack.png",
                        wagered: sessionWagered,
                        payout: sessionPayout,
                        currency: currencyType,
                        creatorId: gameData?.creatorId,
                        gameId: gameData?.id,
                    },
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }

            setGameState("IDLE");
            setPlayerHand([]);
            setDealerHand([]);
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData, gameTitle]);

    useEffect(() => () => clearDealerTimeout(), []);

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const bettingLocked = gameState === "PLAYING" || gameState === "DEALER_TURN";
    const placeholderCard: Card = { suit: "Spades", value: "A", numValue: 11, hidden: true };
    const dealerCardsToRender = dealerHand.length > 0 ? dealerHand : [placeholderCard];
    const playerCardsToRender = playerHand.length > 0 ? playerHand : [placeholderCard];

    const getFaceImage = (value: string) => {
        if (value === "J") return config.customFaceCards.J;
        if (value === "Q") return config.customFaceCards.Q;
        if (value === "K") return config.customFaceCards.K;
        if (value === "A") return config.customFaceCards.A;
        return null;
    };

    const renderCard = (c: Card, idx: number) => {
        if (c.hidden) {
            return (
                <motion.div
                    initial={{ x: 100, y: -100, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    key={`hidden-${idx}`}
                    className="relative -ml-6 flex h-24 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white/10 shadow-xl first:ml-0 sm:h-28 sm:w-20 md:h-36 md:w-24"
                    style={{ background: config.cardBackImage ? undefined : `linear-gradient(135deg, ${config.panelColor}, ${config.accentColor}88)` }}
                >
                    {config.cardBackImage ? (
                        <img src={config.cardBackImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-white/20 text-xl font-bold text-white opacity-80">
                            {config.cardBackEmoji}
                        </div>
                    )}
                </motion.div>
            );
        }

        const isRed = c.suit === "Hearts" || c.suit === "Diamonds";
        const color = isRed ? "text-red-500" : "text-zinc-800";
        const faceImage = getFaceImage(c.value);

        return (
            <motion.div
                initial={{ x: 100, y: -100, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                key={`${c.value}-${c.suit}-${idx}`}
                className="-ml-6 flex h-24 w-16 select-none flex-col rounded-xl border border-zinc-200 bg-white p-2 shadow-xl first:ml-0 sm:h-28 sm:w-20 md:h-36 md:w-24"
            >
                <div className={`text-sm font-bold leading-none md:text-lg ${color}`}>{c.value}</div>
                <div className={`flex flex-1 items-center justify-center ${faceImage ? "" : `text-3xl md:text-4xl ${color}`}`}>
                    {faceImage ? (
                        <img src={faceImage} alt={c.value} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <>
                            {c.suit === "Spades" && "♠"}
                            {c.suit === "Hearts" && "♥"}
                            {c.suit === "Diamonds" && "♦"}
                            {c.suit === "Clubs" && "♣"}
                        </>
                    )}
                </div>
            </motion.div>
        );
    };

    const buttonStyle = { backgroundColor: config.accentColor, boxShadow: `0 0 22px ${config.accentColor}55` };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center overflow-hidden bg-black p-0 md:items-center md:bg-black/80 md:p-4 md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-5xl flex-col-reverse overflow-hidden rounded-none border border-white/10 shadow-2xl md:h-[700px] md:max-h-[90vh] md:flex-row md:rounded-2xl"
                style={{ backgroundColor: config.backgroundColor, borderColor: `${config.accentColor}44` }}
            >
                <MobileGameHudBar
                    style={{ backgroundColor: config.panelColor }}
                    left={<MobileHudBetRow betAmount={betAmount} balance={balance} onBetChange={handleBetChange} disabled={bettingLocked} />}
                    center={
                        gameState === "PLAYING" ? (
                            <button type="button" onClick={hit} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-zinc-700 text-sm font-black uppercase text-white shadow-lg active:scale-95">HIT</button>
                        ) : gameState === "DEALER_TURN" ? (
                            <button type="button" disabled className="flex h-[68px] w-[68px] cursor-wait items-center justify-center rounded-full border border-white/10 bg-[#1a2c38] text-[10px] font-black uppercase text-slate-500 opacity-70">…</button>
                        ) : (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="flex h-[68px] w-[68px] items-center justify-center rounded-full text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-45" style={buttonStyle} aria-label="Deal">
                                <Zap className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            {gameState === "PLAYING" ? (
                                <button type="button" onClick={() => stand()} className="shrink-0 rounded-lg px-2.5 py-3 text-[10px] font-black uppercase leading-tight text-white shadow-md active:scale-95" style={{ backgroundColor: config.accentColor }}>Stand</button>
                            ) : (
                                <button type="button" disabled={bettingLocked} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border bg-[#1a2c38] px-3 py-3 text-xs font-black active:scale-95 disabled:opacity-40" style={{ borderColor: `${config.accentColor}55`, color: config.accentColor }}>MAX</button>
                            )}
                            <MobileHudCurrencyToggle isGC={currencyType === "GC"} disabled={bettingLocked} onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))} />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                <div className="z-20 hidden md:flex md:max-h-none md:w-80 md:shrink-0 md:flex-col md:gap-4 md:overflow-y-auto md:overscroll-contain md:border-r md:border-white/5 md:p-6" style={{ backgroundColor: config.panelColor }}>
                    <div className="mb-2 flex items-center justify-between">
                        <div className="min-w-0 text-white">
                            <h2 className="truncate text-xl font-black uppercase tracking-widest">{gameTitle}</h2>
                            {gameData?.creatorName && <p className="truncate text-[10px] font-bold uppercase tracking-widest" style={{ color: config.accentColor }}>By {gameData.creatorName}</p>}
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <FavoriteToggle gameName={gameTitle} />
                        <GameLeaderboardTrigger variant="header" onClick={() => setLeaderboardOpen(true)} />
                    </div>

                    <div className="mt-2 flex rounded-xl border border-white/5 bg-[#0f171c] p-1">
                        <button
                            type="button"
                            onClick={() => setCurrencyType("GC")}
                            disabled={bettingLocked}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase tracking-wider transition-all ${currencyType === "GC" ? "bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <DiamondIcon className="h-4 w-4" /> GC
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrencyType("FC")}
                            disabled={bettingLocked}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase tracking-wider transition-all ${currencyType === "FC" ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <ForgesCoinIcon className="h-4 w-4" /> FC
                        </button>
                    </div>

                    <div className="mt-2 space-y-2">
                        <div className="flex items-end justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bet Amount</label>
                            <span className="rounded-md bg-black/30 px-2 py-1 font-mono text-xs font-bold text-slate-400">Bal: {balance.toFixed(2)}</span>
                        </div>
                        <input type="number" value={betAmount} onChange={(e) => handleBetChange(Number(e.target.value))} disabled={bettingLocked} className="w-full rounded-xl border border-white/10 bg-[#0a1114] py-3 pl-4 pr-4 font-mono text-lg font-bold text-white outline-none focus:border-white/20" />
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                        <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-green-500" /><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Win</span></div>
                        {lastWin ? <span className="flex items-center gap-1 font-mono text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">---</span>}
                    </div>

                    <div className="mt-auto space-y-3">
                        {gameState === "IDLE" || gameState === "WON" || gameState === "LOST" || gameState === "PUSH" ? (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="h-14 w-full rounded-xl text-xl font-black uppercase tracking-widest text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" style={buttonStyle}>DEAL</button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={hit} disabled={gameState !== "PLAYING"} className="h-14 w-full rounded-xl bg-zinc-800 text-lg font-black uppercase text-white disabled:opacity-50">HIT</button>
                                <button onClick={() => stand()} disabled={gameState !== "PLAYING"} className="h-14 w-full rounded-xl text-lg font-black uppercase text-white disabled:opacity-50" style={buttonStyle}>STAND</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col justify-between overflow-hidden p-6 shadow-inner sm:p-10" style={tableStyle}>
                    {config.backgroundImage && <img src={config.backgroundImage} alt="" className="absolute inset-0 z-0 h-full w-full object-cover opacity-35" />}
                    {config.tableOverlay === "vignette" && <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.65))]" />}
                    {config.tableOverlay === "glow" && <div className="pointer-events-none absolute inset-0 z-0" style={{ boxShadow: `inset 0 0 120px ${config.accentColor}66` }} />}
                    <div className="pointer-events-none absolute inset-0 z-0 bg-black/15" />

                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-200 backdrop-blur-sm md:hidden" aria-label="Close game"><X className="h-5 w-5" /></button>

                    <div className="relative z-10 mb-4 flex flex-col items-center sm:mb-8">
                        <div className="mb-2 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 shadow-lg">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Dealer</span>
                            <span className="font-mono font-black text-white">{calculateHand(dealerHand)}</span>
                        </div>
                        <div className="flex flex-row"><AnimatePresence>{dealerCardsToRender.map((card, i) => renderCard(card, i))}</AnimatePresence></div>
                    </div>

                    <div className="relative z-20 my-auto flex h-24 items-center justify-center py-4">
                        <AnimatePresence>
                            {(gameState === "WON" || gameState === "LOST" || gameState === "PUSH") && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`rounded-full border-4 px-8 py-3 text-xl font-black uppercase tracking-widest text-white shadow-2xl md:text-3xl ${gameState === "WON" ? "border-emerald-400 bg-emerald-500" : gameState === "LOST" ? "border-red-500 bg-red-600" : "border-zinc-500 bg-zinc-600"}`}
                                    style={gameState === "WON" ? { boxShadow: `0 0 50px ${config.accentColor}aa` } : undefined}
                                >
                                    {gameState === "WON" && "YOU WIN!"}
                                    {gameState === "LOST" && "DEALER WINS"}
                                    {gameState === "PUSH" && "PUSH"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative z-10 mt-4 flex flex-col items-center sm:mt-8">
                        <div className="flex flex-row"><AnimatePresence>{playerCardsToRender.map((card, i) => renderCard(card, i))}</AnimatePresence></div>
                        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 shadow-lg">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.accentColor }}>Player</span>
                            <span className="font-mono font-black text-white">{calculateHand(playerHand)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="custom-bj-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="max-h-[min(70vh,520px)] overflow-y-auto rounded-t-2xl border border-b-0 border-white/10 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {gameState === "PLAYING" && (
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={hit} className="rounded-xl border border-white/10 bg-zinc-800 py-3 text-sm font-black uppercase text-white">Hit</button>
                                    <button type="button" onClick={() => stand()} className="rounded-xl py-3 text-sm font-black uppercase text-white" style={{ backgroundColor: config.accentColor }}>Stand</button>
                                </div>
                            )}
                            <GameLeaderboardTrigger variant="mobile-menu" onClick={() => { setLeaderboardOpen(true); setMobileMoreOpen(false); }} />
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="mt-3 w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white">Done</button>
                        </motion.div>
                    </motion.div>
                )}
                <GameLeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} gameName={gameTitle} />
            </AnimatePresence>
        </div>,
        document.body
    );
}
