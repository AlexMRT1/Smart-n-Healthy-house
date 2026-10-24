// Reglas de sensores compartidas por el servidor MQTT

function determineFloodStatus() {
    return "No detectada";
}

function determineGasStatus(data) {
    if (typeof data.gas === "boolean") {
        return data.gas;
    }
    if (typeof data.gas === "string") {
        return data.gas.toLowerCase() === "true";
    }
    return false;
}

function determineFireStatus(data) {
    if (typeof data.fire === "boolean") {
        return data.fire;
    }
    if (typeof data.fire === "string") {
        return data.fire.toLowerCase() === "true";
    }
    return false;
}

function determineGeneralStatus(data) {
    const temp = Number(data.temperatura);
    if (temp > 40) return "Crítico";
    if (temp > 35) return "Precaución";
    return "Normal";
}

function determineAlerts(data) {
    let alertCount = 0;
    const temp = Number(data.temperatura);

    if (temp > 35) alertCount++;

    return `${alertCount} alertas`;
}

function calculateEnvironmentalHealth(data) {
    const temp = Number(data.temperatura);
    const hum = Number(data.humedad);

    if (temp > 40 || hum > 80) return "75%";
    if (temp > 35 || hum > 70) return "85%";
    return "98%";
}

function normalizeSensorPayload(topic, rawText, now = new Date()) {
    const rawData = JSON.parse(rawText);
    const data = Object.keys(rawData).reduce((acc, key) => {
        acc[key.trim()] = rawData[key];
        return acc;
    }, {});

    const sensorData = {
        temperatura: Number(data.temperatura),
        humedad: Number(data.humedad),
        lastUpdate: now.toISOString()
    };

    const dashboardData = {
        topic,
        message: {
            temperature: Number(data.temperatura),
            humidity: Number(data.humedad),
            deviceName: "Smart'n healthy House Test Model",
            flood: determineFloodStatus(data),
            gas: determineGasStatus(data),
            fire: determineFireStatus(data),
            battery: "100%",
            camera: "Inactiva",
            security: "Inactiva",
            generalStatus: determineGeneralStatus(data),
            alerts: determineAlerts(data),
            environmentalHealth: calculateEnvironmentalHealth(data)
        }
    };

    return { sensorData, dashboardData };
}

module.exports = {
    determineFloodStatus,
    determineGasStatus,
    determineFireStatus,
    determineGeneralStatus,
    determineAlerts,
    calculateEnvironmentalHealth,
    normalizeSensorPayload
};
