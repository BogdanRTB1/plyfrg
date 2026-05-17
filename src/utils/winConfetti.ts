import confetti, { type Options } from "canvas-confetti";

let gameMenuOpen = false;

/** Called by game modal hosts when any game menu opens or closes. */
export function setGameMenuOpen(open: boolean) {
    gameMenuOpen = open;
}

export function isGameMenuOpen() {
    return gameMenuOpen;
}

/** Fires win confetti only while a game modal is open. */
export function fireWinConfetti(options?: Options) {
    if (!gameMenuOpen) return;
    return confetti(options);
}
