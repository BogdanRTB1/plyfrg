/** ForgeCoins granted to the user who shared their invite link (one-time signup bonus). */
export const REFERRER_FC_REWARD = 3;

/** Share of invitee house profit paid to the referrer on each losing session (5%). */
export const REFERRER_PROFIT_SHARE = 0.05;

export const REFERRER_PROFIT_SHARE_PERCENT = 5;

/** Diamonds granted to the newly invited user. */
export const REFERRED_DIAMONDS_REWARD = 10_000;

/** Only accounts created within this window can redeem a referral code. */
export const REFERRAL_NEW_ACCOUNT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const PENDING_REFERRAL_STORAGE_KEY = "pending_referral_code";
