function parseSocketUpdate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (!data.message || typeof data.message !== "object" || Array.isArray(data.message)) return null;
    return data.message;
}

function reconnectPlan(attempts, maxAttempts) {
    if (!(attempts < maxAttempts)) {
        return { shouldReconnect: false, attempts };
    }
    return { shouldReconnect: true, attempts: attempts + 1 };
}

const api = { parseSocketUpdate, reconnectPlan };

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.HouseSocket = api;
}
