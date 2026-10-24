const { loadMqttCredentials } = require("../API/server/credentials");

const credentials = loadMqttCredentials();
if (!credentials) {
    console.error("MQTT disabled. Add the device certificates under secrets/ before running this subscriber.");
    process.exit(1);
}

const mqtt = require("mqtt");
const client = mqtt.connect({
    clientId: `sub_${Math.random().toString(16).slice(2, 8)}`,
    host: credentials.host,
    port: credentials.port,
    protocol: "mqtts",
    key: credentials.key,
    cert: credentials.cert,
    ca: credentials.ca,
    rejectUnauthorized: true
});

client.on("connect", () => {
    client.subscribe("/testeo", (err) => {
        if (err) console.error("Subscribe error:", err.message);
        else console.log("Subscribed to /testeo");
    });
});

client.on("message", (topic, message) => {
    console.log(`${topic}: ${message.toString()}`);
});

client.on("error", (error) => {
    console.error("MQTT error:", error.message);
});
