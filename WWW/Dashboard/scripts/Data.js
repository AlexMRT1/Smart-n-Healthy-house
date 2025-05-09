class DeviceDataManager {
    constructor() {
        this.ws = null;
        this.firstMessageReceived = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;

        this.currentStates = {
            temperature: null,
            flood: "No detectada",
            gas: "No detectada",
            humidity: '<span style="color: #FF5252;">ERROR</span>',
            fire: "No detectado",
            battery: null,
            camera: "Inactiva",
            security: "Inactiva",
            generalStatus: "Normal",
            alerts: "0 alertas",
            environmentalHealth: "98%"
        };

        this.elements = {
            temperature: document.querySelector('.room-temp-container .temperature'),
            loader: document.querySelector('.room-temp-container .loader'),
            roomName: document.querySelector('.room-temp-container .room-name')
        };

        // Initialize WebSocket connection
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        try {
            console.log('Initializing WebSocket connection...');
            this.ws = new WebSocket('ws://localhost:3000');
            
            this.ws.onopen = this.handleWebSocketOpen.bind(this);
            this.ws.onmessage = this.handleWebSocketMessage.bind(this);
            this.ws.onclose = this.handleWebSocketClose.bind(this);
            this.ws.onerror = this.handleWebSocketError.bind(this);
            
            this.updateConnectionStatus('connecting');
        } catch (error) {
            console.error('WebSocket initialization error:', error);
            this.handleConnectionError('Error inicializando conexión');
        }
    }

    handleWebSocketOpen() {
        console.log('WebSocket connected successfully');
        this.updateConnectionStatus('connected');
        this.reconnectAttempts = 0;
        this.sendTestMessage();
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.topic && data.message) {
                let parsedMessage;
                try {
                    parsedMessage = typeof data.message === 'string' ? 
                        JSON.parse(data.message) : data.message;
                } catch (e) {
                    parsedMessage = data.message;
                }
                
                if (!this.firstMessageReceived) {
                    this.firstMessageReceived = true;
                    this.handleFirstMessage();
                }
                
                this.updateStates(parsedMessage);
                this.updateUI(parsedMessage);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    handleWebSocketClose() {
        console.log('WebSocket connection closed');
        this.updateConnectionStatus('disconnected');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.initializeWebSocket(), this.reconnectDelay);
        } else {
            this.handleConnectionError('Se excedió el número máximo de intentos de reconexión');
        }
    }

    handleWebSocketError(error) {
        console.error('WebSocket error:', error);
        this.handleConnectionError('Error de conexión');
    }

    sendMessage(topic, message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return false;
        }

        try {
            const payload = {
                topic,
                message: typeof message === 'string' ? message : JSON.stringify(message)
            };
            
            this.ws.send(JSON.stringify(payload));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    sendTestMessage() {
        const testMessage = {
            type: 'test',
            clientId: `WEB_${Math.random().toString(16).substr(2, 8)}`,
            timestamp: Date.now(),
            data: {
                temperature: 25,
                humidity: 60
            }
        };

        console.log('Sending test message:', testMessage);
        
        if (this.sendMessage('testeo/', testMessage)) {
            console.log('Test message sent successfully');
        } else {
            console.error('Failed to send test message');
        }
    }

    updateStates(data) {
        const humidityValue = data.humedad || data.humidity;
        if (humidityValue === undefined || humidityValue === null) {
            this.currentStates.humidity = '<span style="color: #FF5252;">ERROR</span>';
        } else {
            const humidityNum = parseFloat(humidityValue);
            if (isNaN(humidityNum)) {
                this.currentStates.humidity = '<span style="color: #FF5252;">ERROR</span>';
            } else {
                this.currentStates.humidity = `${humidityNum.toFixed(1)}%`;
            }
        }

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'humidity') {
                this.currentStates[key] = value;
            }
        });

        this.analyzeStates();
    }

    analyzeStates() {
        let alertCount = 0;
        let status = "Normal";

        if (this.currentStates.temperature > 35) {
            alertCount++;
            status = "Precaución";
        }

        if (this.currentStates.gas === "Detectada") {
            alertCount++;
            status = "Crítico";
        }

        if (this.currentStates.fire === "Detectado") {
            alertCount++;
            status = "Crítico";
        }

        this.currentStates.alerts = `${alertCount} alertas`;
        this.currentStates.generalStatus = status;
    }

    updateUI(data) {
        if (!this.firstMessageReceived) {
            this.firstMessageReceived = true;
            this.handleFirstMessage();
        }

        // Actualizar temperatura
        if (data.temperature !== undefined) {
            const tempElement = document.querySelector('.room-temp-container .temperature');
            if (tempElement) {
                tempElement.textContent = `${data.temperature}°`;
            }
            // También actualizar el sensor de sensación corporal
            const bodyTempElement = document.querySelector('.sensor-item:first-child .sensor-value');
            if (bodyTempElement) {
                bodyTempElement.textContent = `${data.temperature}°`;
            }
        }

        // Actualizar humedad
        if (data.humidity !== undefined) {
            const humidityElement = document.querySelector('.sensor-value[data-sensor="humidity"]');
            if (humidityElement) {
                const humidityValue = parseFloat(data.humidity);
                if (!isNaN(humidityValue)) {
                    humidityElement.innerHTML = `${humidityValue.toFixed(1)}%`;
                }
            }
        }

        this.updateSensorDisplays();
    }

    updateSensorDisplays() {
        Object.entries(this.currentStates).forEach(([key, value]) => {
            const element = document.querySelector(`.sensor-value[data-sensor="${key}"]`);
            if (element) {
                switch(key) {
                    case 'temperature':
                        element.textContent = `${value}°`;
                        break;
                    case 'humidity':
                        element.innerHTML = value;
                        break;
                    default:
                        element.textContent = value;
                }
            }
        });
    }

    handleFirstMessage() {
        gsap.to(this.elements.loader, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.elements.loader.style.display = 'none';
                this.elements.temperature.style.display = 'block';
                this.elements.roomName.style.display = 'block';

                gsap.from([this.elements.temperature, this.elements.roomName], {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    stagger: 0.1
                });
            }
        });
    }

    updateConnectionStatus(status) {
        if (!this.elements.temperature) return;

        const statusMessages = {
            connecting: '<span style="color: #FFA500;">Conectando al servidor...</span>',
            connected: '<span style="color: #4CAF50;">Conectado</span>',
            disconnected: '<span style="color: #FF5252;">Desconectado</span>',
            offline: '<span style="color: #FF5252;">Servidor no disponible</span>'
        };

        this.elements.temperature.innerHTML = statusMessages[status] || statusMessages.offline;
    }

    handleConnectionError(message) {
        console.error('Connection error:', message);
        if (this.elements.loader) {
            this.elements.loader.style.display = 'none';
        }
        if (this.elements.temperature) {
            this.elements.temperature.style.display = 'block';
            this.elements.temperature.innerHTML = `<span style="color: #FF5252;">${message}</span>`;
        }
        if (this.elements.roomName) {
            this.elements.roomName.style.display = 'block';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.deviceManager = new DeviceDataManager();
});