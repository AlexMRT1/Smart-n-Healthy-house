const test = require("node:test");
const assert = require("node:assert/strict");
const { loadMqttCredentials } = require("../API/server/credentials");

const names = [
    "MQTT_PRIVATE_KEY",
    "MQTT_CERT",
    "MQTT_CA",
    "MQTT_PRIVATE_KEY_PATH",
    "MQTT_CERT_PATH",
    "MQTT_CA_PATH"
];

test("mqtt stays off when the material is missing", () => {
    const previous = {};
    for (const name of names) {
        previous[name] = process.env[name];
        delete process.env[name];
    }
    process.env.MQTT_PRIVATE_KEY_PATH = "secrets/missing.key";
    process.env.MQTT_CERT_PATH = "secrets/missing.cert";
    process.env.MQTT_CA_PATH = "secrets/missing.ca";

    try {
        assert.equal(loadMqttCredentials(), null);
    } finally {
        for (const name of names) {
            if (previous[name] === undefined) delete process.env[name];
            else process.env[name] = previous[name];
        }
    }
});
