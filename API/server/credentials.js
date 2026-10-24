const fs = require("fs");
const path = require("path");

const secretsDir = path.join(__dirname, "..", "..", "secrets");

function readMaterial(envName, pathEnvName, fileName) {
    if (process.env[envName]) {
        return process.env[envName].replace(/\\n/g, "\n");
    }

    const filePath = process.env[pathEnvName] || path.join(secretsDir, fileName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
}

function loadMqttCredentials() {
    const key = readMaterial("MQTT_PRIVATE_KEY", "MQTT_PRIVATE_KEY_PATH", "mqtt.key");
    const cert = readMaterial("MQTT_CERT", "MQTT_CERT_PATH", "mqtt.cert");
    const ca = readMaterial("MQTT_CA", "MQTT_CA_PATH", "mqtt.ca");
    if (!key || !cert || !ca) return null;

    return {
        key,
        cert,
        ca,
        host: process.env.MQTT_HOST || "acw04p2w17u4m-ats.iot.us-east-1.amazonaws.com",
        port: Number(process.env.MQTT_PORT || 8883)
    };
}

module.exports = { loadMqttCredentials };
