import { PENDING_REFERRAL_STORAGE_KEY } from "@/constants/referrals";

export function normalizeReferralCode(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const code = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(code)) return null;
    return code;
}

export function storePendingReferralCode(code: string) {
    const normalized = normalizeReferralCode(code);
    if (!normalized || typeof window === "undefined") return;
    localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, normalized);
}

export function getPendingReferralCode(): string | null {
    if (typeof window === "undefined") return null;
    return normalizeReferralCode(localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY));
}

export function clearPendingReferralCode() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
}
