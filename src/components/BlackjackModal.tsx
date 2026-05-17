"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Spade, Club, Heart, Diamond, MoreHorizontal, Zap } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { applyBlackjackPayout } from "@/utils/originalsMath";

// INFLUENCER/ADMIN CUSTOMIZATION CONFIG
export const BLACKJACK_CONFIG = {
    theme: {
        background: "bg-[#0f212e]",
        panelBg: "bg-[#121c22]",
        tableBg: "bg-emerald-900/40",
        accent: "text-emerald-500",
        buttonAccent: "bg-emerald-500 hover:bg-emerald-400",
        cardBackBg: "bg-gradient-to-br from-indigo-900 to-purple-900",
    },
    names: {
        title: "Blackjack"
    },
    cards: {
        backDesign: "♠", // Pattern or icon for back of card
        suitColors: { Hearts: "text-red-500", Diamonds: "text-red-500", Clubs: "text-zinc-800", Spades: "text-zinc-800" },
    }
};

type Card = {
    suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
    value: string; // 'A', '2', ..., '10', 'J', 'Q', 'K'
    numValue: number; // 1-11
    hidden?: boolean;
};

export default function BlackjackModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'DEALER_TURN' | 'WON' | 'LOST' | 'PUSH'>('IDLE');

    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const dealerTimeoutRef = useRef<number | null>(null);
    const roundIdRef = useRef(0);

    // simple deck logic
    const drawCard = (): Card => {
        const suits: ('Hearts' | 'Diamonds' | 'Clubs' | 'Spades')[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const value = values[Math.floor(Math.random() * values.length)];

        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        if (['J', 'Q', 'K'].includes(value)) numValue = 10;

        return { suit, value, numValue };
    };

    const calculateHand = (hand: Card[]) => {
        let total = 0;
        let aces = 0;
        hand.forEach(c => {
            if (!c.hidden) {
                total += c.numValue;
                if (c.value === 'A') aces += 1;
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
        hand.forEach(c => {
            if (!c.hidden) {
                total += c.numValue;
                if (c.value === 'A') aces += 1;
            }
        });

        let acesCountedAsEleven = aces;
        while (total > 21 && acesCountedAsEleven > 0) {
            total -= 10;
            acesCountedAsEleven -= 1;
        }

        return { total, isSoft: acesCountedAsEleven > 0 };
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

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);
        playGameSound('blackjack', 'bet');

        const pHand: Card[] = [drawCard(), drawCard()];
        const dHand: Card[] = [drawCard(), { ...drawCard(), hidden: true }];

        setPlayerHand(pHand);
        setDealerHand(dHand);

        const pTotal = calculateHand(pHand);
        if (pTotal === 21) {
            setGameState('WON'); // Blackjack
            payOut(2.5);
            setDealerHand(dHand.map(c => ({ ...c, hidden: false })));
        } else {
            setGameState('PLAYING');
        }
    };

    const hit = () => {
        if (gameState !== 'PLAYING') return;
        const pHand = [...playerHand, drawCard()];
        setPlayerHand(pHand);

        if (calculateHand(pHand) > 21) {
            playGameSound('blackjack', 'lose');
            setGameState('LOST');
            setDealerHand(dealerHand.map(c => ({ ...c, hidden: false })));
        } else if (calculateHand(pHand) === 21) {
            stand(pHand);
        }
    };

    const stand = (pHand = playerHand) => {
        if (gameState !== 'PLAYING') return;
        setGameState('DEALER_TURN');
        clearDealerTimeout();
        const activeRoundId = roundIdRef.current;

        let dHand: Card[] = dealerHand.map(c => ({ ...c, hidden: false }));

        // Dealer should hit on totals below 17 and on soft 17.
        const playDealer = () => {
            if (activeRoundId !== roundIdRef.current || !isOpen) return;

            const { total: dTotal, isSoft } = getHandTotals(dHand);
            const shouldHit = dTotal < 17 || (dTotal === 17 && isSoft);

            if (shouldHit) {
                dealerTimeoutRef.current = window.setTimeout(() => {
                    if (activeRoundId !== roundIdRef.current || !isOpen) return;
                    const newCard = drawCard();
                    dHand = [...dHand, newCard];
                    setDealerHand(dHand);
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
            setGameState('WON');
            payOut(2); // 1:1 payout + original bet returned
        } else if (pTotal < dTotal) {
            playGameSound('blackjack', 'lose');
            setGameState('LOST');
        } else {
            setGameState('PUSH');
            payOut(1); // Return original bet
        }
    };

    const payOut = (multiplier: number) => {
        const winAmount = applyBlackjackPayout(betAmount, multiplier);
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);

        if (multiplier > 1) {
            playGameSound('blackjack', 'win');
            fireWinConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING' || gameState === 'DEALER_TURN') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    
    useEffect(() => {
        if (isOpen) resumeOriginalGameAudio();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            clearDealerTimeout();
            roundIdRef.current += 1;
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                // Record session for consolidated history
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Blackjack", 
                        gameImage: "/images/game-blackjack.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));

                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            setGameState('IDLE');

            setPlayerHand([]);
            setDealerHand([]);
        }
    }, [isOpen, sessionWagered, sessionPayout]);

    useEffect(() => {
        return () => {
            clearDealerTimeout();
        };
    }, []);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const bettingLocked = gameState === "PLAYING" || gameState === "DEALER_TURN";

    const placeholderCard: Card = { suit: 'Spades', value: 'A', numValue: 11, hidden: true };
    const dealerCardsToRender = dealerHand.length > 0 ? dealerHand : [placeholderCard];
    const playerCardsToRender = playerHand.length > 0 ? playerHand : [placeholderCard];

    const renderCard = (c: Card, idx: number) => {
        if (c.hidden) {
            return (
                <motion.div
                    initial={{ x: 100, y: -100, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    key={`hidden-${idx}`}
                    className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl border-2 border-white/10 shadow-xl flex items-center justify-center ${BLACKJACK_CONFIG.theme.cardBackBg} -ml-6 first:ml-0`}
                >
                    <div className="w-10 h-10 border-2 border-white/20 rounded opacity-50 flex items-center justify-center font-bold text-white">
                        {BLACKJACK_CONFIG.cards.backDesign}
                    </div>
                </motion.div>
            )
        }

        const isRed = c.suit === 'Hearts' || c.suit === 'Diamonds';
        const color = isRed ? BLACKJACK_CONFIG.cards.suitColors.Hearts : BLACKJACK_CONFIG.cards.suitColors.Spades;

        return (
            <motion.div
                initial={{ x: 100, y: -100, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                key={`${c.value}-${c.suit}-${idx}`}
                className={`w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 bg-white rounded-xl shadow-xl flex flex-col p-2 select-none -ml-6 first:ml-0 border border-zinc-200`}
            >
                <div className={`text-sm md:text-lg font-bold leading-none ${color}`}>
                    {c.value}
                </div>
                <div className={`flex-1 flex items-center justify-center text-3xl md:text-4xl ${color}`}>
                    {c.suit === 'Spades' && '♠'}
                    {c.suit === 'Hearts' && '♥'}
                    {c.suit === 'Diamonds' && '♦'}
                    {c.suit === 'Clubs' && '♣'}
                </div>
            </motion.div>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${BLACKJACK_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={BLACKJACK_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={bettingLocked}
                        />
                    }
                    center={
                        gameState === "PLAYING" ? (
                            <button type="button" onClick={hit} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-zinc-700 text-sm font-black uppercase text-white shadow-lg active:scale-95" aria-label="Hit">
                                HIT
                            </button>
                        ) : gameState === "DEALER_TURN" ? (
                            <button type="button" disabled className="flex h-[68px] w-[68px] cursor-wait items-center justify-center rounded-full border border-white/10 bg-[#1a2c38] text-[10px] font-black uppercase text-slate-500 opacity-70" aria-label="Dealer turn">
                                …
                            </button>
                        ) : (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${BLACKJACK_CONFIG.theme.buttonAccent} text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`} aria-label="Deal">
                                <Zap className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            {gameState === "PLAYING" ? (
                                <button type="button" onClick={() => stand()} className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-600 px-2.5 py-3 text-[10px] font-black uppercase leading-tight text-white shadow-md active:scale-95">Stand</button>
                            ) : (
                                <button type="button" disabled={bettingLocked} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border border-[#00b9f0]/30 bg-[#1a2c38] px-3 py-3 text-xs font-black text-[#00b9f0] active:scale-95 disabled:opacity-40">MAX</button>
                            )}
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={bettingLocked}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU */}
                <div className={`z-20 hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${BLACKJACK_CONFIG.theme.panelBg} flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{BLACKJACK_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={BLACKJACK_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
                    </div>

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-black/30 px-2 py-1 rounded-md">Bal: {balance.toFixed(2)}</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {currencyType === 'GC' ? <DiamondIcon className="w-5 h-5 opacity-70" /> : <ForgesCoinIcon className="w-5 h-5 opacity-70" />}
                            </div>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => handleBetChange(Number(e.target.value))}
                                disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING' || gameState === 'DEALER_TURN'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-green-500 w-4 h-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Win</span>
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    <div className="mt-auto space-y-3">
                        {gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'PUSH' ? (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className={`w-full ${BLACKJACK_CONFIG.theme.buttonAccent} text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    DEAL
                                </span>
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={hit}
                                    disabled={gameState !== 'PLAYING'}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-14 rounded-xl font-black text-lg uppercase transition-all shadow-md disabled:opacity-50"
                                >
                                    HIT
                                </button>
                                <button
                                    onClick={() => stand()}
                                    disabled={gameState !== 'PLAYING'}
                                    className={`w-full ${BLACKJACK_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-lg uppercase transition-all shadow-[0_5px_15px_rgba(16,185,129,0.2)] disabled:opacity-50`}
                                >
                                    STAND
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* GAME AREA - Table */}
                <div className={`relative flex flex-1 flex-col justify-between overflow-hidden ${BLACKJACK_CONFIG.theme.tableBg} p-6 shadow-inner sm:p-10`}>
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-200 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>

                    {/* Background decor */}
                    <div className="absolute inset-0 z-0 bg-black/10"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.6))] z-0 pointer-events-none"></div>

                    {/* Dealer Side */}
                    <div className="relative z-10 flex flex-col items-center top-0 mb-4 sm:mb-8">
                        <div className="flex gap-2 items-center mb-2 px-4 py-1.5 bg-black/40 rounded-full border border-white/10 shadow-lg">
                            <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">Dealer</span>
                            <span className="text-white font-mono font-black">{calculateHand(dealerHand)}</span>
                        </div>
                        <div className="flex flex-row">
                            <AnimatePresence>
                                {dealerCardsToRender.map((card, i) => renderCard(card, i))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Center Message */}
                    <div className="relative z-20 flex justify-center items-center py-4 my-auto h-24">
                        <AnimatePresence>
                            {(gameState === 'WON' || gameState === 'LOST' || gameState === 'PUSH') && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`px-8 transition-colors py-3 rounded-full text-white font-black text-xl md:text-3xl uppercase tracking-widest shadow-2xl border-4 ${gameState === 'WON' ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.8)]' :
                                        gameState === 'LOST' ? 'bg-red-600 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.8)]' :
                                            'bg-zinc-600 border-zinc-500 shadow-[0_0_30px_rgba(161,161,170,0.8)]'
                                        }`}
                                >
                                    {gameState === 'WON' && 'YOU WIN!'}
                                    {gameState === 'LOST' && 'DEALER WINS'}
                                    {gameState === 'PUSH' && 'PUSH'}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Player Side */}
                    <div className="relative z-10 flex flex-col items-center bottom-0 mt-4 sm:mt-8">
                        <div className="flex flex-row">
                            <AnimatePresence>
                                {playerCardsToRender.map((card, i) => renderCard(card, i))}
                            </AnimatePresence>
                        </div>
                        <div className="flex gap-2 items-center mt-4 px-4 py-1.5 bg-black/40 rounded-full border border-white/10 shadow-lg">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Player</span>
                            <span className="text-white font-mono font-black">{calculateHand(playerHand)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="bj-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className={`max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{BLACKJACK_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={BLACKJACK_CONFIG.names.title} />
                            </div>
                            {gameState === "PLAYING" && (
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <button type="button" onClick={hit} className="rounded-xl border border-white/10 bg-zinc-800 py-3 text-sm font-black uppercase text-white active:bg-zinc-700">Hit</button>
                                    <button type="button" onClick={() => stand()} className="rounded-xl border border-emerald-500/40 bg-emerald-600 py-3 text-sm font-black uppercase text-white active:brightness-110">Stand</button>
                                </div>
                            )}
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}
