const mqtt = require("mqtt");
const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const socketIo = require("socket.io");
const cors = require("cors");
const { normalizeSensorPayload } = require("./domain/sensors");
const {
    isToday,
    filterIncidentsForToday,
    incidentFromHttp,
    incidentFromSocket,
    incidentFromMqtt
} = require("./domain/incidents");
const { loadMqttCredentials } = require("./credentials");

const PORT = Number(process.env.PORT || 3000);
const MQTT_TOPICS = ["testeo", "/testeo", "esp32/sensor", "/report-incident"];

function createState() {
    return {
        sensorData: {
            temperatura: null,
            humedad: null,
            lastUpdate: null
        },
        systemStatus: {
            api: { status: "Funcionando", lastCheck: new Date(), responseTime: "200ms" },
            database: { status: "Funcionando", lastCheck: new Date(), connections: 0 },
            sensors: { status: "Funcionando", activeSensors: 0, lastUpdate: new Date() },
            incidents: [],
            lastCleanup: new Date()
        }
    };
}

function assertIncidentObject(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        const error = new Error("Incident body must be an object");
        error.statusCode = 400;
        throw error;
    }
}

function createHouseApp() {
    const state = createState();
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
        cors: { origin: process.env.CORS_ORIGIN || "*", methods: ["GET", "POST"] },
        transports: ["websocket", "polling"]
    });

    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
    app.use(express.json({ limit: "100kb" }));
    app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true }));
    app.use(express.static(path.join(__dirname, "..", "..", "WWW", "Dashboard")));

    function cleanOldIncidents() {
        state.systemStatus.incidents = filterIncidentsForToday(state.systemStatus.incidents);
    }

    app.get("/health", (req, res) => {
        res.json({ ok: true });
    });

    app.get("/status", (req, res) => {
        const now = new Date();
        if (!isToday(state.systemStatus.lastCleanup, now)) {
            cleanOldIncidents();
            state.systemStatus.lastCleanup = now;
        }

        state.systemStatus.database.connections = io.sockets.sockets.size;
        state.systemStatus.sensors.activeSensors = Number.isFinite(state.sensorData.temperatura) ? 1 : 0;
        state.systemStatus.sensors.lastUpdate = state.sensorData.lastUpdate;
        res.json(state.systemStatus);
    });

    app.post("/report-incident", (req, res) => {
        try {
            assertIncidentObject(req.body);
            const incident = incidentFromHttp(req.body);
            state.systemStatus.incidents.unshift(incident);
            io.emit("newIncident", incident);
            res.json({ success: true, incident });
        } catch (error) {
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    });

    app.post("/clear-incidents", (req, res) => {
        state.systemStatus.incidents = [];
        state.systemStatus.lastCleanup = new Date();
        io.emit("incidentsCleared");
        res.status(200).json({
            success: true,
            message: "Todos los incidentes han sido eliminados"
        });
    });

    io.on("connection", (socket) => {
        socket.emit("getStatus", state.systemStatus);

        socket.on("publish", ({ topic, message } = {}) => {
            if (topic !== "/report-incident") return;
            try {
                const incident = JSON.parse(message);
                assertIncidentObject(incident);
                const formattedIncident = incidentFromSocket(incident);
                state.systemStatus.incidents.unshift(formattedIncident);
                io.emit("newIncident", formattedIncident);
            } catch (error) {
                console.error("Error processing incident:", error.message);
            }
        });
    });

    return { app, server, io, state, cleanOldIncidents };
}

function attachMqtt(house, credentials) {
    const client = mqtt.connect({
        clientId: `api_${Math.random().toString(16).slice(2, 8)}`,
        host: credentials.host,
        port: credentials.port,
        protocol: "mqtts",
        key: credentials.key,
        cert: credentials.cert,
        ca: credentials.ca,
        rejectUnauthorized: true,
        keepalive: 60,
        reconnectPeriod: 5000
    });

    client.on("connect", () => {
        MQTT_TOPICS.forEach((topic) => {
            client.subscribe(topic, (err) => {
                if (err) console.error(`Error subscribing to ${topic}:`, err.message);
            });
        });
    });

    client.on("error", (error) => {
        console.error("MQTT error:", error.message);
    });

    client.on("message", (topic, message) => {
        if (topic === "/report-incident") {
            try {
                const incident = JSON.parse(message.toString());
                assertIncidentObject(incident);
                const formattedIncident = incidentFromMqtt(incident);
                house.state.systemStatus.incidents.unshift(formattedIncident);
                house.io.emit("newIncident", formattedIncident);
            } catch (error) {
                console.error("Error processing incident:", error.message);
            }
            return;
        }

        try {
            const parsed = normalizeSensorPayload(topic, message.toString());
            house.state.sensorData = parsed.sensorData;
            house.io.emit("sensorUpdate", parsed.dashboardData);
        } catch (error) {
            console.error("Error processing message:", error.message);
        }
    });

    return client;
}

function scheduleCleanup(house) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timer = setTimeout(() => {
        house.cleanOldIncidents();
        house.state.systemStatus.lastCleanup = new Date();
        scheduleCleanup(house);
    }, tomorrow - now);
    timer.unref();
}

function startHouseServer() {
    const house = createHouseApp();
    const credentials = loadMqttCredentials();
    const client = credentials ? attachMqtt(house, credentials) : null;
    if (!client) {
        console.log("MQTT disabled. Add secrets/mqtt.key, mqtt.cert and mqtt.ca, or set the MQTT_* variables.");
    }

    scheduleCleanup(house);

    let shuttingDown = false;
    function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`${signal} received. Closing the house server.`);
        if (client) client.end(false);
        house.io.close();
        house.server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10000).unref();
    }

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));

    house.server.listen(PORT, () => {
        console.log(`House server listening on port ${PORT}`);
    });

    return house;
}

if (require.main === module) {
    startHouseServer();
}

module.exports = { createHouseApp, startHouseServer };
