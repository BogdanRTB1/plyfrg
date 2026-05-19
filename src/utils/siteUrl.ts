/** Canonical public site URL (no trailing slash). */
export const DEFAULT_APP_ORIGIN = "https://www.playforges.us";

function normalizeOrigin(url: string): string {
    return url.trim().replace(/\/$/, "");
}

function isLocalHost(hostname: string): boolean {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

/** Server-side: origin for redirects (OAuth callback, emails). Never send users to localhost in production. */
export function getRequestAppOrigin(request: Request): string {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (fromEnv) return normalizeOrigin(fromEnv);

    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
    if (host && !isLocalHost(host.split(":")[0])) {
        const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
        return `${proto}://${host}`;
    }

    try {
        const { origin, hostname } = new URL(request.url);
        if (!isLocalHost(hostname)) return origin;
    } catch {
        /* ignore */
    }

    return DEFAULT_APP_ORIGIN;
}

/** Client-side: OAuth / password-reset redirect base URL. */
export function getClientAppOrigin(): string {
    if (typeof window !== "undefined") {
        const { origin, hostname } = window.location;
        if (!isLocalHost(hostname)) return origin;
        return origin;
    }

    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (fromEnv) return normalizeOrigin(fromEnv);
    return DEFAULT_APP_ORIGIN;
}

export function buildAppUrl(path: string, request?: Request): string {
    const base = request ? getRequestAppOrigin(request) : getClientAppOrigin();
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
