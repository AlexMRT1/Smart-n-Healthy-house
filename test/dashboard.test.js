const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const {
    formatRelativeTime,
    formatHumidityFromReading,
    analyzeStates,
    formatSensorText,
    buildPublishPayload,
    connectionPresentation,
    canReconnect
} = require("../WWW/Dashboard/scripts/logic");

test("relative time hits every boundary", () => {
    const cases = [
        [-1000, "Hace un momento"],
        [0, "Hace un momento"],
        [29_000, "Hace un momento"],
        [30_000, "Hace 30 segundos"],
        [59_000, "Hace 59 segundos"],
        [60_000, "Hace 1 minuto"],
        [119_000, "Hace 1 minuto"],
        [120_000, "Hace 2 minutos"],
        [3_599_000, "Hace 59 minutos"],
        [3_600_000, "Hace 1 hora"],
        [7_200_000, "Hace 2 horas"],
        [86_399_000, "Hace 23 horas"],
        [86_400_000, "Hace 1 día"],
        [172_800_000, "Hace 2 días"]
    ];

    for (const [diff, text] of cases) {
        assert.equal(formatRelativeTime(diff), text);
    }
});

test("humidity keeps a real zero and rejects empty values", () => {
    assert.equal(formatHumidityFromReading({}), "--");
    assert.equal(formatHumidityFromReading({ humedad: null }), "--");
    assert.equal(formatHumidityFromReading({ humedad: "abc" }), "--");
    assert.equal(formatHumidityFromReading({ humedad: 0 }), "0.0%");
    assert.equal(formatHumidityFromReading({ humedad: 0, humidity: 40 }), "0.0%");
    assert.equal(formatHumidityFromReading({ humidity: "22.26" }), "22.3%");
    assert.equal(formatHumidityFromReading({ humedad: 22 }), "22.0%");
});

test("board status counts gas and fire above temperature", () => {
    assert.deepEqual(analyzeStates({ temperature: 35, gas: "No detectada", fire: "No detectado" }), {
        alerts: "0 alertas",
        generalStatus: "Normal"
    });
    assert.equal(analyzeStates({ temperature: 36, gas: "No detectada", fire: "No detectado" }).generalStatus, "Precaución");
    assert.equal(analyzeStates({ temperature: 41, gas: "No detectada", fire: "No detectado" }).generalStatus, "Crítico");
    assert.equal(analyzeStates({ temperature: "36", gas: "No", fire: "No" }).alerts, "1 alertas");

    const critical = analyzeStates({ temperature: 36, gas: "Detectada", fire: "Detectado" });
    assert.equal(critical.generalStatus, "Crítico");
    assert.equal(critical.alerts, "3 alertas");
    assert.equal(analyzeStates({ temperature: 20, gas: "detectada", fire: "Detectado" }).alerts, "1 alertas");

    const fromSensors = analyzeStates({ temperature: 22, gas: true, fire: true, flood: "Detectada" });
    assert.equal(fromSensors.generalStatus, "Crítico");
    assert.equal(fromSensors.alerts, "3 alertas");
    assert.equal(analyzeStates({ temperature: 22, gas: false, fire: false, flood: "No detectada" }).alerts, "0 alertas");
});

test("sensor labels, payloads and connection copy", () => {
    assert.equal(formatSensorText("gas", true), "Detectada");
    assert.equal(formatSensorText("gas", "detectada"), "No detectada");
    assert.equal(formatSensorText("fire", "Detectado"), "Detectado");
    assert.equal(formatSensorText("fire", false), "No detectado");
    assert.equal(formatSensorText("temperature", 21), "21°");
    assert.equal(formatSensorText("water", 10), "10%");
    assert.equal(formatSensorText("camera", "Activa"), "Activa");

    assert.deepEqual(buildPublishPayload("room", "plain"), { topic: "room", message: "plain" });
    assert.deepEqual(buildPublishPayload("room", { ok: true }), { topic: "room", message: "{\"ok\":true}" });

    assert.equal(connectionPresentation("connected").text, "Conectado");
    assert.equal(connectionPresentation("nope").text, "Desconectado");
    assert.equal(connectionPresentation("connecting").dot, "#FFA500");

    for (let attempt = 0; attempt < 8; attempt += 1) {
        assert.equal(canReconnect(attempt, 5), attempt < 5);
    }
});
