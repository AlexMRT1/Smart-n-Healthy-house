function formatClock(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function wheelDirection(deltaY, elapsedMs) {
    if (!(elapsedMs > 500)) return null;
    if (!(Math.abs(Number(deltaY)) > 30)) return null;
    return deltaY > 0 ? "down" : "up";
}

function scrollPace(scrollCount, elapsedMs) {
    if (elapsedMs < 300) return "fast";
    if (scrollCount > 4) return "burst";
    return "ok";
}

const api = { formatClock, wheelDirection, scrollPace };

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.HouseView = api;
}
