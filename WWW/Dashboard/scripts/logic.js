// Textos y reglas puras del tablero, sin DOM

function formatRelativeTime(diffMs) {
    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 30) {
        return "Hace un momento";
    }
    if (seconds < 60) {
        return `Hace ${seconds} segundos`;
    }
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `Hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
    }

    const days = Math.floor(seconds / 86400);
    return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

function formatHumidityFromReading(data) {
    const humidityValue = data.humedad ?? data.humidity;
    if (humidityValue === undefined || humidityValue === null) {
        return "--";
    }

    const humidityNum = parseFloat(humidityValue);
    if (Number.isNaN(humidityNum)) {
        return "--";
    }

    return `${humidityNum.toFixed(1)}%`;
}

function analyzeStates(states) {
    let alertCount = 0;
    let status = "Normal";

    if (states.temperature > 40) {
        alertCount++;
        status = "Crítico";
    } else if (states.temperature > 35) {
        alertCount++;
        status = "Precaución";
    }

    if (states.gas === true || states.gas === "Detectada") {
        alertCount++;
        status = "Crítico";
    }

    if (states.fire === true || states.fire === "Detectado") {
        alertCount++;
        status = "Crítico";
    }

    if (states.flood === true || states.flood === "Detectada") {
        alertCount++;
        status = "Crítico";
    }

    return {
        alerts: `${alertCount} alertas`,
        generalStatus: status
    };
}

function formatGasLabel(value) {
    return value === true || value === "Detectada" ? "Detectada" : "No detectada";
}

function formatFireLabel(value) {
    return value === true || value === "Detectado" ? "Detectado" : "No detectado";
}

function formatSensorText(sensor, value) {
    if (sensor === "gas") return formatGasLabel(value);
    if (sensor === "fire") return formatFireLabel(value);
    if (sensor === "temperature") return `${value}°`;
    if (sensor === "humidity" || sensor === "water") return `${value}%`;
    return value;
}

function buildPublishPayload(topic, message) {
    return {
        topic,
        message: typeof message === "string" ? message : JSON.stringify(message)
    };
}

function connectionPresentation(status) {
    const states = {
        connecting: {
            dot: "#FFA500",
            text: "Conectando...",
            color: "#FFA500"
        },
        connected: {
            dot: "#4CAF50",
            text: "Conectado",
            color: "#1a1a1a"
        },
        disconnected: {
            dot: "#FF5252",
            text: "Desconectado",
            color: "#FF5252"
        }
    };

    return states[status] || states.disconnected;
}

function canReconnect(attempts, maxAttempts) {
    return attempts < maxAttempts;
}

const api = {
    formatRelativeTime,
    formatHumidityFromReading,
    analyzeStates,
    formatGasLabel,
    formatFireLabel,
    formatSensorText,
    buildPublishPayload,
    connectionPresentation,
    canReconnect
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
}

if (typeof window !== "undefined") {
    window.HouseLogic = api;
}
