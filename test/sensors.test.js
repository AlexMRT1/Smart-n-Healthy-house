const test = require("node:test");
const assert = require("node:assert/strict");
const {
    determineFloodStatus,
    determineGasStatus,
    determineFireStatus,
    determineGeneralStatus,
    determineAlerts,
    calculateEnvironmentalHealth,
    normalizeSensorPayload
} = require("../API/server/domain/sensors");

const gasSamples = [true, false, "true", "TRUE", "True", "false", "FALSE", " true", "true ", "yes", "1", 1, 0, null, undefined, {}, []];

test("gas and fire only accept real booleans or the word true", () => {
    const expectedGas = {
        true: true,
        false: false,
        TRUE: true,
        True: true,
        falseWord: false
    };

    assert.equal(determineGasStatus({ gas: true }), expectedGas.true);
    assert.equal(determineGasStatus({ gas: false }), expectedGas.false);
    assert.equal(determineGasStatus({ gas: "TRUE" }), expectedGas.TRUE);
    assert.equal(determineGasStatus({ gas: "True" }), expectedGas.True);
    assert.equal(determineGasStatus({ gas: "false" }), expectedGas.falseWord);
    assert.equal(determineFireStatus({ fire: "FALSE" }), false);
    assert.equal(determineFireStatus({ fire: true }), true);

    for (const sample of gasSamples) {
        const gas = determineGasStatus({ gas: sample });
        const fire = determineFireStatus({ fire: sample });
        assert.equal(typeof gas, "boolean");
        assert.equal(typeof fire, "boolean");
        if (typeof sample === "string") {
            assert.equal(gas, sample.toLowerCase() === "true");
            assert.equal(fire, sample.toLowerCase() === "true");
        } else if (typeof sample === "boolean") {
            assert.equal(gas, sample);
            assert.equal(fire, sample);
        } else {
            assert.equal(gas, false);
            assert.equal(fire, false);
        }
    }
});

test("temperature bands stay on the current thresholds", () => {
    const samples = [-20, 0, 35, 35.0001, 36, 40, 40.1, 41, 100, NaN, "36", "nope", null];

    for (const temp of samples) {
        const status = determineGeneralStatus({ temperatura: temp });
        const alerts = determineAlerts({ temperatura: temp });
        const numeric = Number(temp);

        if (numeric > 40) {
            assert.equal(status, "Crítico");
            assert.equal(alerts, "1 alertas");
        } else if (numeric > 35) {
            assert.equal(status, "Precaución");
            assert.equal(alerts, "1 alertas");
        } else {
            assert.equal(status, "Normal");
            assert.equal(alerts, "0 alertas");
        }
    }

    assert.equal(determineGeneralStatus({ temperatura: 50 }), "Crítico");
});

test("environmental health uses the stricter band first", () => {
    assert.equal(calculateEnvironmentalHealth({ temperatura: 40, humedad: 80 }), "85%");
    assert.equal(calculateEnvironmentalHealth({ temperatura: 40.01, humedad: 10 }), "75%");
    assert.equal(calculateEnvironmentalHealth({ temperatura: 10, humedad: 80.01 }), "75%");
    assert.equal(calculateEnvironmentalHealth({ temperatura: 35.01, humedad: 10 }), "85%");
    assert.equal(calculateEnvironmentalHealth({ temperatura: 10, humedad: 70.01 }), "85%");
    assert.equal(calculateEnvironmentalHealth({ temperatura: 35, humedad: 70 }), "98%");

    for (let temp = -10; temp <= 60; temp += 0.5) {
        for (const hum of [0, 70, 70.1, 80, 80.1, 100]) {
            const health = calculateEnvironmentalHealth({ temperatura: temp, humedad: hum });
            if (temp > 40 || hum > 80) assert.equal(health, "75%");
            else if (temp > 35 || hum > 70) assert.equal(health, "85%");
            else assert.equal(health, "98%");
        }
    }
});

test("flood, gas and fire raise the alert count", () => {
    assert.equal(determineFloodStatus({ flood: true }), "Detectada");
    assert.equal(determineFloodStatus({ flood: "detectada" }), "Detectada");
    assert.equal(determineFloodStatus({ flood: false }), "No detectada");
    assert.equal(determineFloodStatus({ flood: "false" }), "No detectada");
    assert.equal(determineFloodStatus({}), "No detectada");

    assert.equal(determineAlerts({ temperatura: 22, gas: true, fire: false, flood: true }), "2 alertas");
    assert.equal(determineAlerts({ temperatura: 36, gas: "true", fire: "TRUE", flood: "No" }), "3 alertas");
    assert.equal(determineGeneralStatus({ temperatura: 22, fire: true }), "Crítico");
    assert.equal(determineGeneralStatus({ temperatura: 36, gas: false, fire: false }), "Precaución");
});

test("flood follows the payload and sensor keys are trimmed", () => {
    const now = new Date("2026-10-23T18:00:00.000Z");
    const raw = JSON.stringify({
        " temperatura ": "22.5",
        " humedad ": "40",
        gas: "true",
        fire: false,
        flood: true
    });

    const parsed = normalizeSensorPayload("esp32/sensor", raw, now);

    assert.equal(parsed.sensorData.temperatura, 22.5);
    assert.equal(parsed.sensorData.humedad, 40);
    assert.equal(parsed.sensorData.lastUpdate, now.toISOString());
    assert.equal(parsed.dashboardData.topic, "esp32/sensor");
    assert.equal(parsed.dashboardData.message.flood, "Detectada");
    assert.equal(parsed.dashboardData.message.gas, true);
    assert.equal(parsed.dashboardData.message.fire, false);
    assert.equal(parsed.dashboardData.message.battery, "100%");
    assert.equal(parsed.dashboardData.message.camera, "Inactiva");
    assert.equal(parsed.dashboardData.message.generalStatus, "Crítico");
    assert.equal(parsed.dashboardData.message.alerts, "2 alertas");
    assert.equal(parsed.dashboardData.message.environmentalHealth, "98%");
});

test("broken sensor payloads fail closed", () => {
    assert.throws(() => normalizeSensorPayload("x", "not-json"));
    assert.throws(() => normalizeSensorPayload("x", "null"));

    const numeric = normalizeSensorPayload("x", "12");
    assert.equal(Number.isNaN(numeric.sensorData.temperatura), true);
    assert.equal(numeric.dashboardData.message.generalStatus, "Normal");

    const empty = normalizeSensorPayload("x", "{}");
    assert.equal(Number.isNaN(empty.sensorData.temperatura), true);
    assert.equal(empty.dashboardData.message.generalStatus, "Normal");
    assert.equal(empty.dashboardData.message.gas, false);
    assert.equal(empty.dashboardData.message.alerts, "0 alertas");
});

test("duplicate trimmed keys keep the last value", () => {
    const raw = JSON.stringify({ "temp ": 1 });
    const parsed = JSON.parse(raw);
    parsed.temperatura = 10;
    parsed[" temperatura"] = 30;

    const result = normalizeSensorPayload("topic", JSON.stringify({
        temperatura: 10,
        " temperatura": 30,
        humedad: "8"
    }));

    assert.equal(result.sensorData.temperatura, 30);
    assert.equal(result.sensorData.humedad, 8);
});
