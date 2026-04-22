"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { recordGameActivity, recordGameSession } from "@/utils/gameBridge";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";


// Import all game modals
import HeistModal from "@/components/HeistModal";
import InfluencerModal from "@/components/InfluencerModal";
import EscapeModal from "@/components/EscapeModal";
import BombModal from "@/components/BombModal";
import MinesModal from "@/components/MinesModal";
import SlotsModal from "@/components/SlotsModal";
import BlackjackModal from "@/components/BlackjackModal";
import RouletteModal from "@/components/RouletteModal";
import CrashModal from "@/components/CrashModal";
import SneakModal from "@/components/SneakModal";
import DartWheelModal from "@/components/DartWheelModal";
import AviatorModal from "@/components/AviatorModal";
import TomatoesModal from "@/components/TomatoesModal";
import FootballModal from "@/components/FootballModal";
import GlassBridgeModal from "@/components/GlassBridgeModal";
import WantedModal from "@/components/WantedModal";
import PlinkoModal from "@/components/PlinkoModal";

// Custom game modals
import CustomSlotsModal from "@/components/CustomSlotsModal";
import CustomPlinkoModal from "@/components/CustomPlinkoModal";
import CustomMinesModal from "@/components/CustomMinesModal";
import CustomCrashModal from "@/components/CustomCrashModal";
import CustomScratchModal from "@/components/CustomScratchModal";
import CustomWheelModal from "@/components/CustomWheelModal";
import CustomCaseModal from "@/components/CustomCaseModal";
import CustomHiloModal from "@/components/CustomHiloModal";
import AIGameModal from "@/components/AIGameModal";

// Other modals
import CreatorApplicationModal from "@/components/CreatorApplicationModal";

export default function GlobalGameModals() {
    // State for all modals
    const [isPlinkoOpen, setIsPlinkoOpen] = useState(false);
    const [isHeistOpen, setIsHeistOpen] = useState(false);
    const [isInfluencerOpen, setIsInfluencerOpen] = useState(false);
    const [isWantedOpen, setIsWantedOpen] = useState(false);
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

    const [activeCustomGame, setActiveCustomGame] = useState<any>(null);
    const [isCustomSlotsOpen, setIsCustomSlotsOpen] = useState(false);
    const [isCustomPlinkoOpen, setIsCustomPlinkoOpen] = useState(false);
    const [isCustomMinesOpen, setIsCustomMinesOpen] = useState(false);
    const [isCustomCrashOpen, setIsCustomCrashOpen] = useState(false);
    const [isCustomScratchOpen, setIsCustomScratchOpen] = useState(false);
    const [isCustomWheelOpen, setIsCustomWheelOpen] = useState(false);
    const [isCustomCaseOpen, setIsCustomCaseOpen] = useState(false);
    const [isCustomHiloOpen, setIsCustomHiloOpen] = useState(false);
    const [isAIGameOpen, setIsAIGameOpen] = useState(false);

    const [isCreatorAppOpen, setIsCreatorAppOpen] = useState(false);
    const pathname = usePathname();


    // Balance & User state
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0);
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        const fetchBalance = async (user: User) => {
            try {
                const { data, error } = await supabase
                    .from('user_balances')
                    .select('diamonds, forges_coins')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setDiamonds(Number(data.diamonds));
                    setForgesCoins(Number(data.forges_coins));
                } else if (error && error.code === 'PGRST116') {
                    await supabase.from('user_balances').insert({
                        id: user.id,
                        diamonds: 0,
                        forges_coins: 0
                    });
                    setDiamonds(0);
                    setForgesCoins(0);
                }
            } catch (err) {
                console.error('Balance fetch error:', err);
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
            if (user) {
                fetchBalance(user);
            } else {
                setDiamonds(0);
                setForgesCoins(0);
                localStorage.removeItem('user_diamonds');
                localStorage.removeItem('user_forges_coins');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync state to DB
    useEffect(() => {
        if (!isInitialFetchDone) return;
        localStorage.setItem('user_diamonds', diamonds.toString());
        localStorage.setItem('user_forges_coins', forgesCoins.toString());
        window.dispatchEvent(new Event('balance_updated'));

        if (!sessionUser) return;
        const supabase = createClient();
        const timeout = setTimeout(async () => {
            await supabase.from('user_balances').update({
                diamonds: Math.floor(diamonds),
                forges_coins: Number(forgesCoins.toFixed(2)),
                updated_at: new Date().toISOString()
            }).eq('id', sessionUser.id);
        }, 500);
        return () => clearTimeout(timeout);
    }, [diamonds, forgesCoins, sessionUser, isInitialFetchDone]);

    // Global Listeners
    useEffect(() => {
        const handleOpenGame = ((e: CustomEvent) => {
            const data = e.detail;
            const label = typeof data === 'string' ? data : data.name;
            
            if (typeof data === 'object' && data !== null) {
                setActiveCustomGame(data);
                if (data.type === 'ai_generated' || data.type === 'manual_template' || data.type === 'slot_engine') setIsAIGameOpen(true);
                else if (data.type === 'slots') setIsCustomSlotsOpen(true);
                else if (data.type === 'plinko') setIsCustomPlinkoOpen(true);
                else if (data.type === 'mines') setIsCustomMinesOpen(true);
                else if (data.type === 'crash') setIsCustomCrashOpen(true);
                else if (data.type === 'scratch') setIsCustomScratchOpen(true);
                else if (data.type === 'wheel') setIsCustomWheelOpen(true);
                else if (data.type === 'case') setIsCustomCaseOpen(true);
                else if (data.type === 'hilo') setIsCustomHiloOpen(true);
                // Record activity for custom game
                recordGameActivity(label);
                return;
            }

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
            else if (label === 'CreatorApplication') setIsCreatorAppOpen(true);
        }) as EventListener;


        window.addEventListener('open_game', handleOpenGame);
        
        const gameToOpen = localStorage.getItem('open_game_on_load');
        if (gameToOpen) {
            localStorage.removeItem('open_game_on_load');
            window.dispatchEvent(new CustomEvent('open_game', { detail: gameToOpen }));
        }

        const handleGameSessionComplete = ((e: CustomEvent) => {
            const detail = e.detail;
            if (detail) {
                recordGameSession(detail);
            }
        }) as EventListener;
        window.addEventListener('game_session_complete', handleGameSessionComplete);

        return () => {
             window.removeEventListener('open_game', handleOpenGame);
             window.removeEventListener('game_session_complete', handleGameSessionComplete);
        };
    }, [pathname]);


    // Listen for balance updates from Header/Wallet
    useEffect(() => {
        const handleExternalUpdate = () => {
            const d = localStorage.getItem('user_diamonds');
            const f = localStorage.getItem('user_forges_coins');
            if (d) setDiamonds(parseInt(d));
            if (f) setForgesCoins(parseFloat(f));
        };
        window.addEventListener('balance_updated', handleExternalUpdate);
        return () => window.removeEventListener('balance_updated', handleExternalUpdate);
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

            <CustomSlotsModal isOpen={isCustomSlotsOpen} onClose={() => setIsCustomSlotsOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomPlinkoModal isOpen={isCustomPlinkoOpen} onClose={() => setIsCustomPlinkoOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomMinesModal isOpen={isCustomMinesOpen} onClose={() => setIsCustomMinesOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomCrashModal isOpen={isCustomCrashOpen} onClose={() => setIsCustomCrashOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomScratchModal isOpen={isCustomScratchOpen} onClose={() => setIsCustomScratchOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomWheelModal isOpen={isCustomWheelOpen} onClose={() => setIsCustomWheelOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomCaseModal isOpen={isCustomCaseOpen} onClose={() => setIsCustomCaseOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CustomHiloModal isOpen={isCustomHiloOpen} onClose={() => setIsCustomHiloOpen(false)} gameConfig={activeCustomGame} gameName={activeCustomGame?.name} />
            
            {activeCustomGame && (
                <AIGameModal isOpen={isAIGameOpen} onClose={() => setIsAIGameOpen(false)} gameData={activeCustomGame} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            )}

            <CreatorApplicationModal isOpen={isCreatorAppOpen} onClose={() => setIsCreatorAppOpen(false)} />
        </>
    );
}
