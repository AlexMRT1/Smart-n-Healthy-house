const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients
const clients = new Set();

// Simulated sensor data
let sensorData = {
    temperature: 25,  // El valor numérico sin el símbolo °
    humidity: 60,     // El valor numérico sin el símbolo %
    gas: "No detectada",
    fire: "No detectado",
    flood: "No detectada",
    battery: 100,
    camera: "Inactiva",
    security: "Inactiva"
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    // Send initial data to new client
    ws.send(JSON.stringify({
        topic: 'sensors/data',
        message: {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            gas: sensorData.gas,
            fire: sensorData.fire,
            flood: sensorData.flood,
            battery: sensorData.battery,
            camera: sensorData.camera,
            security: sensorData.security
        }
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Message received:', data);
            
            // Broadcast to all other clients
            clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ 
                        topic: data.topic, 
                        message: data.message 
                    }));
                }
            });

            // Update local sensor data if applicable
            if (data.topic === 'sensors/update') {
                sensorData = { ...sensorData, ...data.message };
            }

        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// REST endpoints
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        clients: clients.size,
        sensorData
    });
});

const startServer = (port) => {
    server.listen(port)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error('Server error:', err);
            }
        })
        .on('listening', () => {
            const actualPort = server.address().port;
            console.log(`Server running on port ${actualPort}`);
        });
};

const PORT = process.env.PORT || 3000;
startServer(PORT);