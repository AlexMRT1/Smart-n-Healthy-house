const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Add PORT constant
const PORT = process.env.PORT || 3000;

// Certificados como cadenas de texto (reemplaza con tus certificados)
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEA1k89Y5L3iCrRqlom4Ayj2yHPVDU7ngWkAIbmCFe26pDEx3/O
lVoCR7Tjc3+bVftIPzTZZIkQLlUE3d2x6/Pkq9JdsH3Bbe+TuBw/i3gPwK2mfusw
5OILQ6azGtXj77mEJ9BYvLGuBGJKM2KaDTY2STaZq7yZoInvzYHWsGIfvooaQKCD
cIkV8GYbjTdnb0VMztx9KPv68KODoEUFcTwGNMP/C0VQCcBqBjn0zdqEn1InC7eq
ZvJY1iPowh3V3aO5Vz/PJm7hvvLKXqcDZgZwYNDVU+TTa+Cp8Ban3d0pMkiEyLW9
+JmX5yE3UMU3A++fvYtjcPJ6EeqzqjpRPYZqhQIDAQABAoIBAQC/QJvyXtfUhxHx
St7il6UrC/MwnQkFLtd7OOfUjiLJFkTmHOLJWjgqsf1Bt6Fyi/ufnJRdKgxsrKbZ
MN11SoTJ6cR+mtuiNmnHpj33Q0AbnVy2a0GJIUkYKI4x5qux5gdQWJi4XICFnQnG
7bm5DKZJlBZzsq4PHMoKxlJHumnF6WsOmuG9zNWUkK5qvvA5R+YMBmtKQVKSPYMF
cxi1rBnu1txJNVomHqiruSXArkVGzZDCG4AqeRS53wXKPuCoAhqw1xUJOpBLalA2
vFt2GFw1kkCnfMaRZp1+dUAZoKSfW0y3rJZ0XvKtM/+7lYOX1CEy9walqEs3NbJu
3ks5OkHBAoGBAOtfIQhIk0OgLvz35tVv+LRX4/poxl2zZhvmBj/tBDmQeUqFM6aD
SHNo0I9W+pPnvi09/nD3qiqh/Ks3G45KxFvFdv2IeQuSlI6tmTT9FA7niz76q6A3
e/QHIJs/xnYRBVKmLkXAasFTTldffzbTJ2NzaqwprKUFqjbrAiaEcdz5AoGBAOkX
jj08A3+UaN2PMIjJbxKapqToKTtr3VJsnLZnPyVaYFl2PjBlMLNPiOwxVv1B2PGM
v50ehwfWqMCCb4LNDMDNpZngomA4COqCUAW+U93WLa/wM4/ii38lyEMgVLRxbOIX
NocEx93IEOc11wJqwQAAzSZU4+dPtUC3ejwTcZjtAoGBAJYi3CM4iBc++joKt4e2
IOKInbeBVec3JA7vr1Tfjy5Y5cWPKd8xJunXFhIY3UWzMTASt1a/5B/FrDJauI0P
TCltz/TxNKUZHwHT4kJWnJDVSZEmvIs6WSrT0Qy2pZVyTf7mWeXMU0x2IybAl5kV
H67kVEr1Wlb5QhY92eVP3oGhAoGBANM3+Dm+90CVwIz84zMgrZkDMP0AL9Tbwpud
NkkHuC3l/qcywdni6EWkTeQSNcya7ba9HymGb0AIIbUIvXmey+6uq2CMMTfVryaq
XU9HEAJWweHLXT4GQPg/yYAifP9iRRN/i3bAO0jasY6CuEpFaIzTLROOG1MRZKK3
YHmt+ONlAoGBAMqmID5+5GdsUSHyhnqFUvVvkfOIwGVCA8eoGcL8E/pGEvRkYjuB
fjAUYi/C+O9GNG1WW1/bnmR1uP0l1kY2697gksWpYicdgvhI8Q7wBA202hV+Xnrl
dhE5Oaq4+HlHyIVKr25ibS5peoxPhtTe0MGKo6GCpdTBlMHI+tgtulOL
-----END RSA PRIVATE KEY-----`;

const cert = `-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUW4D8fth/S6hNz6gWemA9KhyDAQswDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI1MDUwNTIzMjUy
MloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANZPPWOS94gq0apaJuAM
o9shz1Q1O54FpACG5ghXtuqQxMd/zpVaAke043N/m1X7SD802WSJEC5VBN3dsevz
5KvSXbB9wW3vk7gcP4t4D8Ctpn7rMOTiC0OmsxrV4++5hCfQWLyxrgRiSjNimg02
Nkk2mau8maCJ782B1rBiH76KGkCgg3CJFfBmG403Z29FTM7cfSj7+vCjg6BFBXE8
BjTD/wtFUAnAagY59M3ahJ9SJwu3qmbyWNYj6MId1d2juVc/zyZu4b7yyl6nA2YG
cGDQ1VPk02vgqfAWp93dKTJIhMi1vfiZl+chN1DFNwPvn72LY3DyehHqs6o6UT2G
aoUCAwEAAaNgMF4wHwYDVR0jBBgwFoAUtzYQ2z2hJsI/w9manGWama6NtwwwHQYD
VR0OBBYEFLTaifYTf2uPw8awxI7meACsrAskMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQCQmk4QgblzzyX9WpAheTZl8MeB
JzEaATdqWGJjT3yLt9somHGKZ1gy9zn6CrEIaOepmTi4iiLFreA+J+sFZir4XbkQ
aKCwgWafohrUUQ6TIRPb8S4/IDYyLwKN5Y9uBrDV9MeoASim+mxc4uxgJYIBTMf4
v7hKdV3PI/vRew24iWRaXZl2Ma1yEf/qhZctdw85OrteNXMDioJZ43GMvR9dQBho
CS1i2l4+qe+hgEAZEVHNqChCvAjVekeUFMHg3/u10+3oECtoNcLgPqRna4WPQY2d
3zHOcXd8ERA95qEXxtvyGMVcsMTQ0NESkOaErWYjSfifTo0Bx6V0B1JkxWRk
-----END CERTIFICATE-----`;

const ca = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----`;

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../WWW/Dashboard')); // Servir archivos estáticos

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Socket.IO connection monitoring
io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
});

io.on('connect_timeout', () => {
    console.error('Socket.IO connection timeout');
});

io.on('reconnect', (attemptNumber) => {
    console.log(`Socket.IO reconnected after ${attemptNumber} attempts`);
});

io.on('reconnect_attempt', () => {
    console.log('Socket.IO attempting to reconnect...');
});

// Variables globales
let sensorData = {
    temperatura: null,
    humedad: null,
    lastUpdate: null
};

// Añadir función auxiliar para comprobar si una fecha es de hoy
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// Añadir función para limpiar incidentes antiguos
function cleanOldIncidents() {
    const today = new Date();
    systemStatus.incidents = systemStatus.incidents.filter(incident => 
        isToday(new Date(incident.date))
    );
}

// Estado del sistema
let systemStatus = {
    api: {
        status: 'Funcionando',
        lastCheck: new Date(),
        responseTime: '200ms'
    },
    database: {
        status: 'Funcionando',
        lastCheck: new Date(),
        connections: 0
    },
    sensors: {
        status: 'Funcionando',
        activeSensors: 0,
        lastUpdate: new Date()
    },
    incidents: [],
    lastCleanup: new Date()
};

// Endpoint de estado
app.get('/status', (req, res) => {
    // Comprobar si necesitamos limpiar incidentes antiguos
    const now = new Date();
    if (!isToday(systemStatus.lastCleanup)) {
        cleanOldIncidents();
        systemStatus.lastCleanup = now;
    }

    // Actualizar estado en tiempo real
    systemStatus.database.connections = Object.keys(io.sockets.sockets).length;
    systemStatus.sensors.activeSensors = sensorData.temperatura ? 1 : 0;
    systemStatus.sensors.lastUpdate = sensorData.lastUpdate;
    
    res.json(systemStatus);
});

// Modificar el endpoint de report-incident
app.post('/report-incident', express.json(), (req, res) => {
    try {
        // Preservar req.body exactamente como viene, solo añadir fecha
        const incident = {
            ...req.body,
            date: new Date()
        };
        
        systemStatus.incidents.unshift(incident);
        io.emit('newIncident', incident);
        
        res.json({ 
            success: true, 
            incident 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Modificar el endpoint de clear-incidents
app.post('/clear-incidents', (req, res) => {
    try {
        console.log('📝 Clearing all incidents...');
        
        // Clear the incidents array
        systemStatus.incidents = [];
        systemStatus.lastCleanup = new Date();
        
        // Notify all connected clients
        io.emit('incidentsCleared');
        
        console.log('✅ Incidents cleared successfully');
        res.status(200).json({ 
            success: true, 
            message: 'Todos los incidentes han sido eliminados' 
        });
    } catch (error) {
        console.error('❌ Error clearing incidents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al limpiar incidentes',
            error: error.message 
        });
    }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Enviar estado inicial sin modificar los incidentes
    socket.emit('getStatus', systemStatus);

    // Escuchar nuevos reportes
    socket.on('publish', ({ topic, message }) => {
        if (topic === '/report-incident') {
            try {
                const incident = JSON.parse(message);
                // Solo añadir fecha, mantener success como viene
                const formattedIncident = {
                    ...incident,
                    date: new Date()
                };
                
                systemStatus.incidents.unshift(formattedIncident);
                io.emit('newIncident', formattedIncident);
            } catch (error) {
                console.error('Error processing incident:', error);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// MQTT client configuration
const options = {
    clientId: `api_${Math.random().toString(16).substring(2, 8)}`,
    host: 'acw04p2w17u4m-ats.iot.us-east-1.amazonaws.com',
    port: 8883,
    protocol: 'mqtts',
    key: privateKey,
    cert: cert,
    ca: ca,
    rejectUnauthorized: true,
    keepalive: 60,
    reconnectPeriod: 5000
};

const client = mqtt.connect(options);

// MQTT Handlers
client.on('connect', () => {
    console.log('\n=== MQTT Connection Status ===');
    console.log('✅ Connected to AWS IoT Core');
    
    const topics = ['testeo', '/testeo', 'esp32/sensor', '/report-incident'];
    topics.forEach(topic => {
        client.subscribe(topic, (err) => {
            if (!err) {
                console.log(`📥 Subscribed to: ${topic}`);
            } else {
                console.error(`❌ Error subscribing to ${topic}:`, err);
            }
        });
    });
    
    console.log('👂 Listening for sensor data...\n');
});

// Enhanced MQTT error handling
client.on('disconnect', () => {
    console.log('MQTT client disconnected');
});

client.on('reconnect', () => {
    console.log('MQTT client reconnecting...');
});

client.on('close', () => {
    console.log('MQTT connection closed');
});

client.on('offline', () => {
    console.log('MQTT client is offline');
});

client.on('error', (error) => {
    console.error('MQTT error:', error);
});

// Modificar el handler de MQTT para mensajes de incidentes
client.on('message', (topic, message) => {
    if (topic === '/report-incident') {
        try {
            console.log('📥 Incident report received:', message.toString());
            
            // Parsear el mensaje sin modificar su contenido
            const incident = JSON.parse(message.toString());
            
            // Solo añadir fecha si no existe
            const formattedIncident = {
                ...incident,
                date: incident.date || new Date()
            };
            
            // Guardar y emitir sin modificar el success
            systemStatus.incidents.unshift(formattedIncident);
            io.emit('newIncident', formattedIncident);
            
            console.log('✅ Incident processed:', JSON.stringify(formattedIncident, null, 2));
        } catch (error) {
            console.error('❌ Error processing incident:', error);
        }
        return;
    }
    
    try {
        console.log(`📥 Message received on topic ${topic}:`, message.toString());
        
        console.log('📥 Raw message received:', message.toString());
        
        // Parse message and trim whitespace from keys
        const rawData = JSON.parse(message.toString());
        const data = Object.keys(rawData).reduce((acc, key) => {
            acc[key.trim()] = rawData[key];
            return acc;
        }, {});

        // Update sensor data for API endpoints
        sensorData = {
            temperatura: Number(data.temperatura),
            humedad: Number(data.humedad),
            lastUpdate: new Date().toISOString()
        };

        console.log('📊 Processed sensor data:', JSON.stringify(sensorData, null, 2));

        // Format data for the dashboard in the exact format Data.js expects
        const dashboardData = {
            topic: topic,
            message: {
                temperature: Number(data.temperatura),
                humidity: Number(data.humedad),
                deviceName: "Smart'n healthy House Test Model",
                flood: determineFloodStatus(data),
                gas: determineGasStatus(data), // Ahora devuelve boolean
                fire: determineFireStatus(data), // Ahora devuelve boolean
                battery: "100%",
                camera: "Inactiva",
                security: "Inactiva",
                generalStatus: determineGeneralStatus(data),
                alerts: determineAlerts(data),
                environmentalHealth: calculateEnvironmentalHealth(data)
            }
        };

        console.log('📨 Emitting dashboard data:', JSON.stringify(dashboardData, null, 2));

        // Emit to WebSocket clients
        io.emit('sensorUpdate', dashboardData);

    } catch (error) {
        console.error('❌ Error processing message:', error.message);
        console.error('Raw message:', message.toString());
    }
});

// Helper functions for status determination
function determineFloodStatus(data) {
    // Add your flood detection logic here
    return "No detectada";
}

function determineGasStatus(data) {
    // Comprobar si data.gas es un booleano
    if (typeof data.gas === 'boolean') {
        return data.gas;
    }
    // Si es string "true" o "false"
    if (typeof data.gas === 'string') {
        return data.gas.toLowerCase() === 'true';
    }
    return false;
}

function determineFireStatus(data) {
    // Comprobar si data.fire es un booleano
    if (typeof data.fire === 'boolean') {
        return data.fire;
    }
    // Si es string "true" o "false"
    if (typeof data.fire === 'string') {
        return data.fire.toLowerCase() === 'true';
    }
    return false;
}

function determineGeneralStatus(data) {
    const temp = Number(data.temperatura);
    if (temp > 35) return "Precaución";
    if (temp > 40) return "Crítico";
    return "Normal";
}

function determineAlerts(data) {
    let alertCount = 0;
    const temp = Number(data.temperatura);
    
    if (temp > 35) alertCount++;
    // Add more alert conditions here
    
    return `${alertCount} alertas`;
}

function calculateEnvironmentalHealth(data) {
    const temp = Number(data.temperatura);
    const hum = Number(data.humedad);
    
    if (temp > 40 || hum > 80) return "75%";
    if (temp > 35 || hum > 70) return "85%";
    return "98%";
}

// Error handlers
client.on('error', (error) => {
    console.error('❌ MQTT Error:', error.message);
});

client.on('offline', () => {
    console.log('⚠️ MQTT Client disconnected');
});

// Añadir un limpiador programado (al final del archivo)
function scheduleCleanup() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
        cleanOldIncidents();
        systemStatus.lastCleanup = new Date();
        scheduleCleanup(); // Programar la siguiente limpieza
    }, timeUntilMidnight);
}

// Iniciar el programador de limpieza
scheduleCleanup();

// Graceful shutdown handling
let isShuttingDown = false;

function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    if (isShuttingDown) {
        console.log('Shutdown already in progress...');
        return;
    }
    
    isShuttingDown = true;

    // Close MQTT connection
    console.log('Closing MQTT connection...');
    client.end(false, () => {
        console.log('MQTT connection closed.');
    });

    // Close all socket connections
    console.log('Closing Socket.IO connections...');
    io.close(() => {
        console.log('Socket.IO connections closed.');
    });

    // Close HTTP server
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.log('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Add connection status monitoring
let serverStatus = {
    isConnected: false,
    lastConnection: null,
    connectionAttempts: 0,
    maxRetries: 5,
    retryTimeout: 5000
};

function startServer() {
    try {
        server.listen(PORT, () => {
            console.log(`\n=== Server Status ===`);
            console.log(`🚀 Server running on port ${PORT}`);
            serverStatus.isConnected = true;
            serverStatus.lastConnection = new Date();
            serverStatus.connectionAttempts = 0;
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            if (!serverStatus.isConnected && serverStatus.connectionAttempts < serverStatus.maxRetries) {
                serverStatus.connectionAttempts++;
                console.log(`Retrying connection (${serverStatus.connectionAttempts}/${serverStatus.maxRetries})...`);
                setTimeout(startServer, serverStatus.retryTimeout);
            } else {
                console.error('Max retries reached or server error while connected');
                gracefulShutdown('SERVER_ERROR');
            }
        });

    } catch (error) {
        console.error('Error starting server:', error);
        if (serverStatus.connectionAttempts < serverStatus.maxRetries) {
            serverStatus.connectionAttempts++;
            console.log(`Retrying connection (${serverStatus.connectionAttempts}/${serverStatus.maxRetries})...`);
            setTimeout(startServer, serverStatus.retryTimeout);
        } else {
            console.error('Max retries reached');
            process.exit(1);
        }
    }
}

// Start server with connection monitoring
startServer();
