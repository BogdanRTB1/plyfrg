"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { recordGameActivity } from "@/utils/gameBridge";

// Modal Imports
import PlinkoModal from "./PlinkoModal";
import HeistModal from "./HeistModal";
import InfluencerModal from "./InfluencerModal";
import EscapeModal from "./EscapeModal";
import BombModal from "./BombModal";
import MinesModal from "./MinesModal";
import SlotsModal from "./SlotsModal";
import BlackjackModal from "./BlackjackModal";
import RouletteModal from "./RouletteModal";
import CrashModal from "./CrashModal";
import SneakModal from "./SneakModal";
import DartWheelModal from "./DartWheelModal";
import AviatorModal from "./AviatorModal";
import TomatoesModal from "./TomatoesModal";
import FootballModal from "./FootballModal";
import GlassBridgeModal from "./GlassBridgeModal";
import WantedModal from "./WantedModal";
import CustomSlotsModal from "./CustomSlotsModal";
import CustomPlinkoModal from "./CustomPlinkoModal";
import CustomMinesModal from "./CustomMinesModal";
import CustomCrashModal from "./CustomCrashModal";
import AIGameModal from "./AIGameModal";

export default function GlobalGameModals() {
    // Modal States
    const [isPlinkoOpen, setIsPlinkoOpen] = useState(false);
    const [isHeistOpen, setIsHeistOpen] = useState(false);
    const [isInfluencerOpen, setIsInfluencerOpen] = useState(false);
    const [isEscapeOpen, setIsEscapeOpen] = useState(false);
    const [isBombOpen, setIsBombOpen] = useState(false);
    const [isMinesOpen, setIsMinesOpen] = useState(false);
    const [isSlotsOpen, setIsSlotsOpen] = useState(false);
    const [isBlackjackOpen, setIsBlackjackOpen] = useState(false);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isCrashOpen, setIsCrashOpen] = useState(false);
    const [isSneakOpen, setIsSneakOpen] = useState(false);
    const [isDartOpen, setIsDartOpen] = useState(false);
    const [isAviatorOpen, setIsAviatorOpen] = useState(false);
    const [isTomatoesOpen, setIsTomatoesOpen] = useState(false);
    const [isFootballOpen, setIsFootballOpen] = useState(false);
    const [isBridgeOpen, setIsBridgeOpen] = useState(false);
    const [isWantedOpen, setIsWantedOpen] = useState(false);

    // Custom Game States
    const [activeCustomGame, setActiveCustomGame] = useState<any>(null);
    const [isCustomSlotsOpen, setIsCustomSlotsOpen] = useState(false);
    const [isCustomPlinkoOpen, setIsCustomPlinkoOpen] = useState(false);
    const [isCustomMinesOpen, setIsCustomMinesOpen] = useState(false);
    const [isCustomCrashOpen, setIsCustomCrashOpen] = useState(false);
    const [isAIGameOpen, setIsAIGameOpen] = useState(false);

    // Balance States
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);

    // Listen for Game Open Events
    useEffect(() => {
        const handleOpenGame = ((e: CustomEvent) => {
            const label = e.detail;
            
            // If it's a complex object (Custom Game)
            if (typeof label === 'object' && label !== null) {
                setActiveCustomGame(label);
                if (label.type === 'slots') setIsCustomSlotsOpen(true);
                else if (label.type === 'plinko') setIsCustomPlinkoOpen(true);
                else if (label.type === 'mines') setIsCustomMinesOpen(true);
                else if (label.type === 'crash') setIsCustomCrashOpen(true);
                else setIsAIGameOpen(true);
                
                recordGameActivity(label.name || 'Custom Game');
                return;
            }

            // Record activity for trending
            recordGameActivity(label);

            if (label === 'Plinko') setIsPlinkoOpen(true);
            else if (label === 'Heist') setIsHeistOpen(true);
            else if (label === 'Influencer') setIsInfluencerOpen(true);
            else if (label === 'Wanted') setIsWantedOpen(true);
            else if (label === 'Escape') setIsEscapeOpen(true);
            else if (label === 'Bomb Defuse') setIsBombOpen(true);
            else if (label === 'Mines') setIsMinesOpen(true);
            else if (label === 'Slots') setIsSlotsOpen(true);
            else if (label === 'Blackjack') setIsBlackjackOpen(true);
            else if (label === 'Roulette') setIsRouletteOpen(true);
            else if (label === 'Crash') setIsCrashOpen(true);
            else if (label === 'Secret Sneak') setIsSneakOpen(true);
            else if (label === 'Dart Wheel') setIsDartOpen(true);
            else if (label === 'Aviator') setIsAviatorOpen(true);
            else if (label === 'Tomatoes') setIsTomatoesOpen(true);
            else if (label === 'Penalty') setIsFootballOpen(true);
            else if (label === 'Glass Bridge') setIsBridgeOpen(true);
        }) as EventListener;

        window.addEventListener('open_game', handleOpenGame);

        // Handle Session Completion (Save History/Profit)
        const handleSessionComplete = async (e: any) => {
            const { gameName, wagered, payout, currency } = e.detail;
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            const { recordGameSession } = await import("@/utils/gameBridge");
            await recordGameSession({
                gameName,
                gameImage: '', // Option to add image if needed
                wagered,
                payout,
                currency: currency || 'FC'
            });

        };

        window.addEventListener('game_session_complete', handleSessionComplete as any);

        // Auto-open logic (for redirections if they still occur)
        const checkAutoOpen = () => {
            const gameToOpen = localStorage.getItem('open_game_on_load');
            if (gameToOpen) {
                localStorage.removeItem('open_game_on_load');
                window.dispatchEvent(new CustomEvent('open_game', { detail: gameToOpen }));
            }
        };
        setTimeout(checkAutoOpen, 200);

        return () => {
            window.removeEventListener('open_game', handleOpenGame);
            window.removeEventListener('game_session_complete', handleSessionComplete as any);
        };
    }, []);


    // Balance Logic (Copied from HomeContent)
    useEffect(() => {
        const supabase = createClient();

        const fetchBalance = async (user: any) => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('user_balances')
                    .select('diamonds, forges_coins')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setDiamonds(Number(data.diamonds));
                    setForgesCoins(Number(data.forges_coins));
                }
            } catch (err) {
                console.error('Balance fetch exception:', err);
            } finally {
                setIsInitialFetchDone(true);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSessionUser(session.user);
                fetchBalance(session.user);
            } else {
                const savedD = localStorage.getItem('user_diamonds');
                const savedF = localStorage.getItem('user_forges_coins');
                if (savedD) setDiamonds(parseInt(savedD));
                if (savedF) setForgesCoins(parseFloat(savedF));
                setIsInitialFetchDone(true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setSessionUser(user);
            if (user) fetchBalance(user);
            else {
                setDiamonds(0);
                setForgesCoins(0);
                localStorage.removeItem('user_diamonds');
                localStorage.removeItem('user_forges_coins');
                setIsInitialFetchDone(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync Balance to Supabase/LocalStorage
    useEffect(() => {
        if (!isInitialFetchDone) return;
        localStorage.setItem('user_diamonds', diamonds.toString());
        localStorage.setItem('user_forges_coins', forgesCoins.toString());
        window.dispatchEvent(new Event('balance_updated'));

        if (!sessionUser) return;
        const supabase = createClient();
        const timeout = setTimeout(async () => {
            await supabase
                .from('user_balances')
                .update({
                    diamonds: Math.floor(diamonds),
                    forges_coins: Number(forgesCoins.toFixed(2)),
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionUser.id);
        }, 500);

        return () => clearTimeout(timeout);
    }, [diamonds, forgesCoins, sessionUser, isInitialFetchDone]);

    // Handle external updates
    useEffect(() => {
        const handleExternalUpdate = () => {
            const d = localStorage.getItem('user_diamonds');
            const f = localStorage.getItem('user_forges_coins');
            if (d !== null) setDiamonds(parseInt(d));
            if (f !== null) setForgesCoins(parseFloat(f));
        };
        window.addEventListener('balance_updated', handleExternalUpdate);
        window.addEventListener('storage', handleExternalUpdate);
        return () => {
            window.removeEventListener('balance_updated', handleExternalUpdate);
            window.removeEventListener('storage', handleExternalUpdate);
        };
    }, []);

    return (
        <>
            <PlinkoModal isOpen={isPlinkoOpen} onClose={() => setIsPlinkoOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <HeistModal isOpen={isHeistOpen} onClose={() => setIsHeistOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <InfluencerModal isOpen={isInfluencerOpen} onClose={() => setIsInfluencerOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <EscapeModal isOpen={isEscapeOpen} onClose={() => setIsEscapeOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <BombModal isOpen={isBombOpen} onClose={() => setIsBombOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <MinesModal isOpen={isMinesOpen} onClose={() => setIsMinesOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SlotsModal isOpen={isSlotsOpen} onClose={() => setIsSlotsOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <BlackjackModal isOpen={isBlackjackOpen} onClose={() => setIsBlackjackOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <RouletteModal isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CrashModal isOpen={isCrashOpen} onClose={() => setIsCrashOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SneakModal isOpen={isSneakOpen} onClose={() => setIsSneakOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <DartWheelModal isOpen={isDartOpen} onClose={() => setIsDartOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <AviatorModal isOpen={isAviatorOpen} onClose={() => setIsAviatorOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <TomatoesModal isOpen={isTomatoesOpen} onClose={() => setIsTomatoesOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <FootballModal isOpen={isFootballOpen} onClose={() => setIsFootballOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <GlassBridgeModal isOpen={isBridgeOpen} onClose={() => setIsBridgeOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <WantedModal isOpen={isWantedOpen} onClose={() => setIsWantedOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />

            <CustomSlotsModal isOpen={isCustomSlotsOpen} onClose={() => { setIsCustomSlotsOpen(false); setActiveCustomGame(null); }} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomPlinkoModal isOpen={isCustomPlinkoOpen} onClose={() => { setIsCustomPlinkoOpen(false); setActiveCustomGame(null); }} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomMinesModal isOpen={isCustomMinesOpen} onClose={() => { setIsCustomMinesOpen(false); setActiveCustomGame(null); }} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomCrashModal isOpen={isCustomCrashOpen} onClose={() => { setIsCustomCrashOpen(false); setActiveCustomGame(null); }} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            
            {activeCustomGame && (
                <AIGameModal isOpen={isAIGameOpen} onClose={() => { setIsAIGameOpen(false); setActiveCustomGame(null); }} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            )}
        </>
    );
}
