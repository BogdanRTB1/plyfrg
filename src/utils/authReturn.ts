/**
 * Persist where to send the user after sign-up / login (e.g. back to a creator game).
 */

const RETURN_PATH_KEY = "playforges_auth_return_path";

export function saveAuthReturnPath(path: string) {
    if (typeof window === "undefined" || !path) return;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    sessionStorage.setItem(RETURN_PATH_KEY, normalized);
}

export function peekAuthReturnPath(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(RETURN_PATH_KEY);
}

export function consumeAuthReturnPath(): string | null {
    const path = peekAuthReturnPath();
    if (path) sessionStorage.removeItem(RETURN_PATH_KEY);
    return path;
}

/** Open register modal and remember return URL for after auth. */
export function openRegisterWithReturn(returnPath: string) {
    saveAuthReturnPath(returnPath);
    window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: "signup" }));
}

export function navigateAfterAuth(router?: { push: (path: string) => void }) {
    const path = consumeAuthReturnPath();
    if (!path) return false;
    if (router) {
        router.push(path);
    } else if (typeof window !== "undefined") {
        window.location.href = path;
    }
    return true;
}
