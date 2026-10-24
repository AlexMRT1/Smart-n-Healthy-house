// Arma y lee cookies sin tocar document

export function buildSetCookie(name, value, expires) {
    return `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

export function readCookieValue(cookieString, name) {
    try {
        const value = String(cookieString || "")
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1];
        return value ? decodeURIComponent(value) : "";
    } catch (error) {
        return "";
    }
}

export function buildDeleteCookie(name) {
    return `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}
