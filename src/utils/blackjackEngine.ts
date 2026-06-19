export type BlackjackCard = {
    suit: "Hearts" | "Diamonds" | "Clubs" | "Spades";
    value: string;
    numValue: number;
    hidden?: boolean;
};

const SUITS: BlackjackCard["suit"][] = ["Hearts", "Diamonds", "Clubs", "Spades"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function cardValueToNum(value: string): number {
    if (value === "A") return 11;
    if (["J", "Q", "K"].includes(value)) return 10;
    return parseInt(value, 10);
}

function makeCard(suit: BlackjackCard["suit"], value: string): BlackjackCard {
    return { suit, value, numValue: cardValueToNum(value) };
}

export function createShuffledDeck(): BlackjackCard[] {
    const deck: BlackjackCard[] = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push(makeCard(suit, value));
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function drawFromDeck(deck: BlackjackCard[]): BlackjackCard {
    if (deck.length < 12) {
        deck.push(...createShuffledDeck());
    }
    return deck.pop()!;
}

export function calculateBlackjackHand(hand: BlackjackCard[]): number {
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
}

export function getBlackjackHandTotals(hand: BlackjackCard[]) {
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
}

/** Stand on all 17+ (including soft 17) — slightly player-favorable vs hit-soft-17. */
export function shouldDealerHit(hand: BlackjackCard[]): boolean {
    return getBlackjackHandTotals(hand).total < 17;
}

/** Deal a starting hand; redraw up to twice if the player opens very weak (≤12). */
export function dealPlayerStartingHand(deck: BlackjackCard[]): BlackjackCard[] {
    let hand = [drawFromDeck(deck), drawFromDeck(deck)];
    let attempts = 0;
    while (calculateBlackjackHand(hand) <= 12 && attempts < 2) {
        hand = [drawFromDeck(deck), drawFromDeck(deck)];
        attempts += 1;
    }
    return hand;
}

export function dealInitialBlackjackHands(deck: BlackjackCard[]) {
    const playerHand = dealPlayerStartingHand(deck);
    const dealerUp = drawFromDeck(deck);
    const dealerHole = { ...drawFromDeck(deck), hidden: true as const };
    return {
        playerHand,
        dealerHand: [dealerUp, dealerHole],
    };
}
