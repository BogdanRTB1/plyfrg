"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { recordGameActivity, recordGameSession } from "@/utils/gameBridge";
import { setGameMenuOpen } from "@/utils/winConfetti";
import { clearGamePlayUrl } from "@/utils/gameLaunch";
import { User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import {
    BALANCE_REFRESH_EVENT,
    applyBalanceToStorage,
    type UserBalance,
} from "@/utils/balanceClient";
import { DEMO_START_DIAMONDS, DEMO_START_FORGES, getDefaultDemoBalance, loadDemoBalance, resetDemoBalance, saveDemoBalance, setDemoSessionActive } from "@/utils/demoPlay";
import { resolveBuiltInGameLabel } from "@/constants/builtInGames";
import GameLaunchPickerModal from "@/components/GameLaunchPickerModal";
import type { GameLaunchPayload } from "@/utils/gameLaunch";


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
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerGame, setPickerGame] = useState<GameLaunchPayload | null>(null);
    const [isDemoPlay, setIsDemoPlay] = useState(false);
    const [demoDiamonds, setDemoDiamonds] = useState(DEMO_START_DIAMONDS);
    const [demoForgesCoins, setDemoForgesCoins] = useState(DEMO_START_FORGES);
    const pathname = usePathname();

    const startDemoSession = useCallback((fresh = true) => {
        if (fresh) resetDemoBalance();
        const balance = fresh ? getDefaultDemoBalance() : loadDemoBalance();
        setDemoDiamonds(balance.diamonds);
        setDemoForgesCoins(balance.forges_coins);
        setIsDemoPlay(true);
        setDemoSessionActive(true);
    }, []);

    const endDemoSession = useCallback(() => {
        setIsDemoPlay(false);
        setDemoSessionActive(false);
    }, []);

    // Balance & User state
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0);
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
    const skipDbPushRef = useRef(true);

    const applyServerBalance = useCallback((balance: UserBalance) => {
        skipDbPushRef.current = true;
        setDiamonds(balance.diamonds);
        setForgesCoins(balance.forges_coins);
        applyBalanceToStorage(balance);
        window.setTimeout(() => {
            skipDbPushRef.current = false;
        }, 3000);
    }, []);

    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<UserBalance>).detail;
            if (detail) applyServerBalance(detail);
        };
        window.addEventListener(BALANCE_REFRESH_EVENT, handler);
        return () => window.removeEventListener(BALANCE_REFRESH_EVENT, handler);
    }, [applyServerBalance]);

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
                    applyServerBalance({
                        diamonds: Math.floor(Number(data.diamonds)),
                        forges_coins: Number(Number(data.forges_coins).toFixed(2)),
                    });
                } else if (error && error.code === 'PGRST116') {
                    await supabase.from('user_balances').insert({
                        id: user.id,
                        diamonds: 0,
                        forges_coins: 0
                    });
                    applyServerBalance({ diamonds: 0, forges_coins: 0 });
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
    }, [applyServerBalance]);

    // Persist gameplay balance changes only (not server refresh / deposits)
    useEffect(() => {
        if (!isInitialFetchDone || !sessionUser) return;
        if (skipDbPushRef.current) return;

        applyBalanceToStorage({ diamonds, forges_coins: forgesCoins });
        window.dispatchEvent(new Event("balance_updated"));

        const supabase = createClient();
        const timeout = window.setTimeout(async () => {
            const { data: server } = await supabase
                .from("user_balances")
                .select("diamonds, forges_coins")
                .eq("id", sessionUser.id)
                .maybeSingle();

            const serverDiamonds = Math.floor(Number(server?.diamonds ?? 0));
            const localDiamonds = Math.floor(diamonds);

            if (serverDiamonds > localDiamonds + 1) {
                applyServerBalance({
                    diamonds: serverDiamonds,
                    forges_coins: Number(Number(server?.forges_coins ?? 0).toFixed(2)),
                });
                return;
            }

            await supabase
                .from("user_balances")
                .update({
                    diamonds: localDiamonds,
                    forges_coins: Number(forgesCoins.toFixed(2)),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", sessionUser.id);
        }, 500);

        return () => window.clearTimeout(timeout);
    }, [diamonds, forgesCoins, sessionUser, isInitialFetchDone, applyServerBalance]);

    useEffect(() => {
        if (!isDemoPlay) return;
        saveDemoBalance({ diamonds: demoDiamonds, forges_coins: demoForgesCoins });
    }, [isDemoPlay, demoDiamonds, demoForgesCoins]);

    const activeDiamonds = isDemoPlay ? demoDiamonds : diamonds;
    const activeSetDiamonds = isDemoPlay ? setDemoDiamonds : setDiamonds;
    const activeForgesCoins = isDemoPlay ? demoForgesCoins : forgesCoins;
    const activeSetForgesCoins = isDemoPlay ? setDemoForgesCoins : setForgesCoins;

    const getCustomBalanceProps = (game: { isPreview?: boolean; isDemo?: boolean } | null) => {
        if (game?.isPreview) {
            return {
                diamonds: 999999999,
                setDiamonds: () => {},
                forgesCoins: 999999999,
                setForgesCoins: () => {},
            };
        }
        if (game?.isDemo || isDemoPlay) {
            return {
                diamonds: demoDiamonds,
                setDiamonds: setDemoDiamonds,
                forgesCoins: demoForgesCoins,
                setForgesCoins: setDemoForgesCoins,
            };
        }
        return {
            diamonds,
            setDiamonds,
            forgesCoins,
            setForgesCoins,
        };
    };

    // Global Listeners
    useEffect(() => {
        const handleOpenGame = ((e: CustomEvent) => {
            const raw = e.detail;
            const wantsDemo = typeof raw === "object" && raw !== null && !!raw.isDemo;
            const wantsPreview = typeof raw === "object" && raw !== null && !!raw.isPreview;

            if (wantsDemo && !wantsPreview) {
                startDemoSession(true);
            } else if (!wantsPreview) {
                endDemoSession();
            }

            const builtInLabel = resolveBuiltInGameLabel(raw);
            if (builtInLabel) {
                recordGameActivity(builtInLabel);

                if (builtInLabel === "Plinko") setIsPlinkoOpen(true);
                else if (builtInLabel === "Heist") setIsHeistOpen(true);
                else if (builtInLabel === "Influencer") setIsInfluencerOpen(true);
                else if (builtInLabel === "Wanted") setIsWantedOpen(true);
                else if (builtInLabel === "Escape") setIsEscapeOpen(true);
                else if (builtInLabel === "Bomb Defuse") setIsBombOpen(true);
                else if (builtInLabel === "Mines") setIsMinesOpen(true);
                else if (builtInLabel === "Slots") setIsSlotsOpen(true);
                else if (builtInLabel === "Blackjack") setIsBlackjackOpen(true);
                else if (builtInLabel === "Roulette") setIsRouletteOpen(true);
                else if (builtInLabel === "Crash") setIsCrashOpen(true);
                else if (builtInLabel === "Secret Sneak") setIsSneakOpen(true);
                else if (builtInLabel === "Dart Wheel") setIsDartOpen(true);
                else if (builtInLabel === "Aviator") setIsAviatorOpen(true);
                else if (builtInLabel === "Tomatoes") setIsTomatoesOpen(true);
                else if (builtInLabel === "Penalty") setIsFootballOpen(true);
                else if (builtInLabel === "Glass Bridge") setIsBridgeOpen(true);
                else if (builtInLabel === "CreatorApplication") setIsCreatorAppOpen(true);
                return;
            }

            if (typeof raw === "object" && raw !== null) {
                const label = raw.name;
                setActiveCustomGame(raw);
                if (raw.type === "ai_generated" || raw.type === "manual_template" || raw.type === "slot_engine") setIsAIGameOpen(true);
                else if (raw.type === "slots") setIsCustomSlotsOpen(true);
                else if (raw.type === "plinko") setIsCustomPlinkoOpen(true);
                else if (raw.type === "mines") setIsCustomMinesOpen(true);
                else if (raw.type === "crash") setIsCustomCrashOpen(true);
                else if (raw.type === "scratch") setIsCustomScratchOpen(true);
                else if (raw.type === "wheel") setIsCustomWheelOpen(true);
                else if (raw.type === "case") setIsCustomCaseOpen(true);
                else if (raw.type === "hilo") setIsCustomHiloOpen(true);
                recordGameActivity(label);
                return;
            }

            const label = typeof raw === "string" ? raw : "";
            if (!label) return;

            recordGameActivity(label);

            if (label === "Plinko") setIsPlinkoOpen(true);
            else if (label === "Heist") setIsHeistOpen(true);
            else if (label === "Influencer") setIsInfluencerOpen(true);
            else if (label === "Wanted") setIsWantedOpen(true);
            else if (label === "Escape") setIsEscapeOpen(true);
            else if (label === "Bomb Defuse") setIsBombOpen(true);
            else if (label === "Mines") setIsMinesOpen(true);
            else if (label === "Slots") setIsSlotsOpen(true);
            else if (label === "Blackjack") setIsBlackjackOpen(true);
            else if (label === "Roulette") setIsRouletteOpen(true);
            else if (label === "Crash") setIsCrashOpen(true);
            else if (label === "Secret Sneak") setIsSneakOpen(true);
            else if (label === "Dart Wheel") setIsDartOpen(true);
            else if (label === "Aviator") setIsAviatorOpen(true);
            else if (label === "Tomatoes") setIsTomatoesOpen(true);
            else if (label === "Penalty") setIsFootballOpen(true);
            else if (label === "Glass Bridge") setIsBridgeOpen(true);
            else if (label === "CreatorApplication") setIsCreatorAppOpen(true);
        }) as EventListener;


        window.addEventListener('open_game', handleOpenGame);

        const handleOpenPicker = ((e: CustomEvent) => {
            setPickerGame(e.detail);
            setPickerOpen(true);
        }) as EventListener;
        window.addEventListener('open_game_picker', handleOpenPicker);
        
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
             window.removeEventListener('open_game_picker', handleOpenPicker);
             window.removeEventListener('game_session_complete', handleGameSessionComplete);
        };
    }, [pathname, startDemoSession, endDemoSession]);


    const anyGameOpen =
        isPlinkoOpen || isHeistOpen || isInfluencerOpen || isWantedOpen ||
        isEscapeOpen || isBombOpen || isMinesOpen || isSlotsOpen ||
        isBlackjackOpen || isRouletteOpen || isCrashOpen || isSneakOpen ||
        isDartOpen || isAviatorOpen || isTomatoesOpen || isFootballOpen ||
        isBridgeOpen || isCustomSlotsOpen || isCustomPlinkoOpen ||
        isCustomMinesOpen || isCustomCrashOpen || isCustomScratchOpen ||
        isCustomWheelOpen || isCustomCaseOpen || isCustomHiloOpen || isAIGameOpen;

    useEffect(() => {
        setGameMenuOpen(anyGameOpen);
        if (!anyGameOpen) {
            clearGamePlayUrl();
            if (isDemoPlay) endDemoSession();
        }
    }, [
        anyGameOpen,
        isDemoPlay,
        endDemoSession,
        isPlinkoOpen, isHeistOpen, isInfluencerOpen, isWantedOpen, isEscapeOpen, isBombOpen,
        isMinesOpen, isSlotsOpen, isBlackjackOpen, isRouletteOpen, isCrashOpen, isSneakOpen,
        isDartOpen, isAviatorOpen, isTomatoesOpen, isFootballOpen, isBridgeOpen,
        isCustomSlotsOpen, isCustomPlinkoOpen, isCustomMinesOpen, isCustomCrashOpen,
        isCustomScratchOpen, isCustomWheelOpen, isCustomCaseOpen, isCustomHiloOpen, isAIGameOpen,
    ]);

    const customBalance = getCustomBalanceProps(activeCustomGame);

    return (
        <>
            <GameLaunchPickerModal
                isOpen={pickerOpen}
                game={pickerGame}
                onClose={() => setPickerOpen(false)}
            />
            <PlinkoModal isOpen={isPlinkoOpen} onClose={() => setIsPlinkoOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <HeistModal isOpen={isHeistOpen} onClose={() => setIsHeistOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <InfluencerModal isOpen={isInfluencerOpen} onClose={() => setIsInfluencerOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <EscapeModal isOpen={isEscapeOpen} onClose={() => setIsEscapeOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <BombModal isOpen={isBombOpen} onClose={() => setIsBombOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <MinesModal isOpen={isMinesOpen} onClose={() => setIsMinesOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <SlotsModal isOpen={isSlotsOpen} onClose={() => setIsSlotsOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <BlackjackModal isOpen={isBlackjackOpen} onClose={() => setIsBlackjackOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <RouletteModal isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <CrashModal isOpen={isCrashOpen} onClose={() => setIsCrashOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <SneakModal isOpen={isSneakOpen} onClose={() => setIsSneakOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <DartWheelModal isOpen={isDartOpen} onClose={() => setIsDartOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <AviatorModal isOpen={isAviatorOpen} onClose={() => setIsAviatorOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <TomatoesModal isOpen={isTomatoesOpen} onClose={() => setIsTomatoesOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <FootballModal isOpen={isFootballOpen} onClose={() => setIsFootballOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <GlassBridgeModal isOpen={isBridgeOpen} onClose={() => setIsBridgeOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />
            <WantedModal isOpen={isWantedOpen} onClose={() => setIsWantedOpen(false)} diamonds={activeDiamonds} setDiamonds={activeSetDiamonds} forgesCoins={activeForgesCoins} setForgesCoins={activeSetForgesCoins} />

            <CustomSlotsModal isOpen={isCustomSlotsOpen} onClose={() => setIsCustomSlotsOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomPlinkoModal isOpen={isCustomPlinkoOpen} onClose={() => setIsCustomPlinkoOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomMinesModal isOpen={isCustomMinesOpen} onClose={() => setIsCustomMinesOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomCrashModal isOpen={isCustomCrashOpen} onClose={() => setIsCustomCrashOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomScratchModal isOpen={isCustomScratchOpen} onClose={() => setIsCustomScratchOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomWheelModal isOpen={isCustomWheelOpen} onClose={() => setIsCustomWheelOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomCaseModal isOpen={isCustomCaseOpen} onClose={() => setIsCustomCaseOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            <CustomHiloModal isOpen={isCustomHiloOpen} onClose={() => setIsCustomHiloOpen(false)} gameConfig={activeCustomGame} gameName={activeCustomGame?.name} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            
            {activeCustomGame && (
                <AIGameModal isOpen={isAIGameOpen} onClose={() => setIsAIGameOpen(false)} gameData={activeCustomGame} diamonds={customBalance.diamonds} setDiamonds={customBalance.setDiamonds} forgesCoins={customBalance.forgesCoins} setForgesCoins={customBalance.setForgesCoins} />
            )}

            <CreatorApplicationModal isOpen={isCreatorAppOpen} onClose={() => setIsCreatorAppOpen(false)} />
        </>
    );
}
