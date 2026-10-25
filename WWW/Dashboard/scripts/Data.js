const houseLog = typeof HouseLog === "undefined"
    ? { info() {}, warn() {}, error() {} }
    : HouseLog;
const houseSocket = typeof HouseSocket === "undefined"
    ? {
        parseSocketUpdate(data) {
            return data && data.message ? data.message : null;
        },
        reconnectPlan(attempts, maxAttempts) {
            if (!(attempts < maxAttempts)) return { shouldReconnect: false, attempts };
            return { shouldReconnect: true, attempts: attempts + 1 };
        }
    }
    : HouseSocket;

class DeviceDataManager {
    constructor() {
        this.socket = null;
        this.firstMessageReceived = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;

        this.currentStates = {
            temperature: '--',
            humidity: '--',
            deviceName: "Smart'n healthy House Test model",
            flood: "No detectada",
            gas: "No detectada",
            fire: "No detectado",
            battery: null,
            camera: "Inactiva",
            security: "Inactiva",
            generalStatus: "Normal",
            alerts: "0 alertas",
            environmentalHealth: "98%"
        };

        // Asegurarnos de que los elementos existen
        this.elements = {
            temperature: document.querySelector('[data-sensor="temperature"]'),
            humidity: document.querySelector('[data-sensor="humidity"]'),
            roomName: document.querySelector('.room-name'),
            loader: document.querySelector('.loader'),
            spinnerContainer: document.querySelector('.spinner-container'),
            lastUpdateText: document.querySelector('.last-update-text'),
            updateIcon: document.querySelector('.update-icon')
        };

        // Verificar si los elementos críticos existen
        if (!this.elements.lastUpdateText) {
            houseLog.error('Elemento last-update-text no encontrado en el DOM');
        }

        // Inicializar lastUpdate con la fecha actual
        this.lastUpdate = new Date();
        this.updateInterval = null;

        // Iniciar actualizaciones
        this.startUpdateInterval();
        this.initializeSocket();
    }

    startUpdateInterval() {
        // Limpiar intervalo existente
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Actualización inicial
        this.updateLastUpdateText();
        
        // Crear nuevo intervalo
        this.updateInterval = setInterval(() => {
            this.updateLastUpdateText();
        }, 1000); // Actualizar cada segundo
    }

    updateLastUpdateText() {
        if (!this.elements.lastUpdateText) {
            houseLog.warn('Elemento last-update-text no encontrado');
            return;
        }

        const now = new Date();
        const text = HouseLogic.formatRelativeTime(now - this.lastUpdate);

        // Solo actualizar si el texto ha cambiado
        if (this.elements.lastUpdateText.textContent !== text) {
            this.elements.lastUpdateText.textContent = text;
            
            // Animar el icono
            if (this.elements.updateIcon) {
                this.elements.updateIcon.classList.remove('spinning');
                // Forzar un reflow
                void this.elements.updateIcon.offsetWidth;
                // Aplicar la animación
                this.elements.updateIcon.classList.add('spinning');
            }
        }
    }

    forceUpdate() {
        this.lastUpdate = new Date();
        this.updateLastUpdateText();
    }

    initializeSocket() {
        try {
            houseLog.info('Initializing Socket.IO connection');
            this.socket = io('http://localhost:3000', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });
            
            this.socket.on('connect', this.handleSocketOpen.bind(this));
            this.socket.on('sensorUpdate', this.handleSocketMessage.bind(this));
            this.socket.on('disconnect', this.handleSocketClose.bind(this));
            this.socket.on('connect_error', this.handleSocketError.bind(this));
            
            this.updateConnectionStatus('connecting');
        } catch (error) {
            houseLog.error('Socket initialization error', { error: error.message });
            this.handleConnectionError('Error inicializando conexión');
        }
    }

    handleSocketOpen() {
        houseLog.info('Socket.IO connected successfully');
        this.updateConnectionStatus('connected');
        
        if (this.elements.spinnerContainer) {
            gsap.to(this.elements.spinnerContainer, {
                autoAlpha: 0,
                duration: 0.5,
                onComplete: () => {
                    this.elements.spinnerContainer.style.display = 'none';
                }
            });
        }

        this.reconnectAttempts = 0;
    }

    handleSocketMessage(data) {
        try {
            const message = houseSocket.parseSocketUpdate(data);
            houseLog.info('Socket message received', { parsed: Boolean(message) });
            if (!message) return;

            this.lastUpdate = new Date();
            this.updateLastUpdateText();

            if (!this.firstMessageReceived) {
                this.firstMessageReceived = true;
                this.handleFirstMessage();
            }
            this.updateUI(message);
        } catch (error) {
            houseLog.error('Error processing socket message', { error: error.message });
        }
    }

    handleSocketClose() {
        houseLog.info('Socket.IO connection closed');
        this.updateConnectionStatus('disconnected');

        const plan = houseSocket.reconnectPlan(this.reconnectAttempts, this.maxReconnectAttempts);
        this.reconnectAttempts = plan.attempts;
        if (plan.shouldReconnect) {
            houseLog.info('Attempting to reconnect', {
                attempt: this.reconnectAttempts,
                max: this.maxReconnectAttempts
            });
            setTimeout(() => this.initializeSocket(), this.reconnectDelay);
        } else {
            this.handleConnectionError('Se excedió el número máximo de intentos de reconexión');
        }
    }

    handleSocketError(error) {
        houseLog.error('Socket.IO error', { error: error && error.message });
        this.handleConnectionError('Error de conexión');
    }

    sendMessage(topic, message) {
        if (!this.socket || !this.socket.connected) {
            houseLog.error('Socket.IO not connected');
            return false;
        }

        try {
            const payload = HouseLogic.buildPublishPayload(topic, message);
            
            this.socket.emit('sensorUpdate', payload);
            return true;
        } catch (error) {
            houseLog.error('Error sending message', { error: error.message });
            return false;
        }
    }

    updateStates(data) {
        this.currentStates.humidity = HouseLogic.formatHumidityFromReading(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'humidity') {
                this.currentStates[key] = value;
            }
        });

        this.analyzeStates();
    }

    analyzeStates() {
        const result = HouseLogic.analyzeStates(this.currentStates);
        this.currentStates.alerts = result.alerts;
        this.currentStates.generalStatus = result.generalStatus;
    }

    updateUI(data) {
        if (!this.firstMessageReceived) {
            this.firstMessageReceived = true;
            this.handleFirstMessage();
        }

        // Mapeo de claves de datos a data-sensor
        const sensorMap = {
            temperature: 'temperature',
            humidity: 'humidity',
            gas: 'gas',
            fire: 'fire',
            water: 'water',
            camera: 'camera',
            security: 'security'
        };

        Object.entries(sensorMap).forEach(([sensor, key]) => {
            const el = document.querySelector(`.sensor-value[data-sensor="${sensor}"]`);
            const value = data[key];
            if (el !== null && value !== undefined) {
                el.textContent = HouseLogic.formatSensorText(sensor, value);
            }
        });

        // Room name
        const roomNameElement = document.querySelector('.room-name');
        if (roomNameElement) {
            roomNameElement.textContent = data.deviceName || "Smart'n healthy House Test model";
        }

        // Fuego: overlay y temperatura especial
        const fireAlertOverlay = document.querySelector('.fire-alert-overlay');
        const temperatureDisplay = document.querySelector('.temperature');
        if (data.fire === true || data.fire === "Detectado") {
            if (fireAlertOverlay) fireAlertOverlay.style.display = 'block';
            if (temperatureDisplay) {
                temperatureDisplay.classList.add('fire-alert');
                temperatureDisplay.textContent = 'Fuego detectado';
            }
        } else {
            if (fireAlertOverlay) fireAlertOverlay.style.display = 'none';
            if (temperatureDisplay && data.temperature !== undefined) {
                temperatureDisplay.classList.remove('fire-alert');
                temperatureDisplay.textContent = `${data.temperature}°`;
            }
        }

        // Actualiza estados internos y widgets si es necesario
        this.updateStates(data);
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

    updateValue(sensorId, value) {
        const elements = document.querySelectorAll(`[data-sensor="${sensorId}"]`);
        elements.forEach(element => {
            if (element) {
                element.textContent = value;
                element.style.color = '#1a1a1a';
            }
        });
    }

    handleFirstMessage() {
        // Ocultar spinner principal
        const spinnerContainer = document.querySelector('.spinner-container');
        if (spinnerContainer) {
            gsap.to(spinnerContainer, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    spinnerContainer.style.display = 'none';
                }
            });
        }

        // Mostrar contenedor de temperatura
        const tempContainer = document.querySelector('.room-temp-container');
        const temperature = document.querySelector('.temperature');
        const roomName = document.querySelector('.room-name');

        if (tempContainer && temperature && roomName) {
            gsap.set([tempContainer, temperature, roomName], {
                display: 'flex',
                visibility: 'visible',
                opacity: 0,
                y: 20
            });

            gsap.to([tempContainer, temperature, roomName], {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
            });
        }
    }

    updateConnectionStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (!statusDot || !statusText) return;

        const state = HouseLogic.connectionPresentation(status);
        
        statusDot.style.backgroundColor = state.dot;
        statusText.textContent = state.text;
        statusText.style.color = state.color;

        // Actualizar colores de elementos según el estado
        if (status === 'connected') {
            if (this.elements.temperature) {
                this.elements.temperature.style.color = '#1a1a1a';
            }
            if (this.elements.roomName) {
                this.elements.roomName.style.color = '#1a1a1a';
            }
        } else {
            if (this.elements.temperature) {
                this.elements.temperature.style.color = state.color;
            }
            if (this.elements.roomName) {
                this.elements.roomName.style.color = state.color;
            }
        }
    }

    handleConnectionError(message) {
        houseLog.error('Connection error', { message });
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

    connect() {
        const clientId = 'dashboard_' + Math.random().toString(16).substr(2, 8);
        
        AWS.config.region = awsConfig.region;
        const credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: awsConfig.identityPoolId
        });

        AWS.config.credentials = credentials;

        credentials.get((err) => {
            if (err) {
                houseLog.error('Error getting AWS credentials', { error: err && err.message });
                this.updateConnectionStatus(false);
                return;
            }

            this.client = mqtt.connect(
                `wss://${awsConfig.endpoint}/mqtt`,
                {
                    clientId: clientId,
                    protocol: 'wss',
                    keepalive: 60,
                    protocolVersion: 4,
                    clean: true,
                    reconnectPeriod: 5000,
                    connectTimeout: 5000,
                    will: {
                        topic: this.topic + 'status',
                        payload: JSON.stringify({
                            deviceId: clientId,
                            status: 'disconnected',
                            timestamp: new Date().toISOString()
                        }),
                        qos: 0,
                        retain: false
                    }
                }
            );

            this.client.on('connect', () => {
                houseLog.info('Conectado a AWS IoT Core');
                this.updateConnectionStatus(true);

                this.client.subscribe(this.topic + '#', (err) => {
                    if (!err) {
                        houseLog.info('Suscrito al topico', { topic: this.topic });
                        this.client.publish(this.topic + 'status', JSON.stringify({
                            deviceId: clientId,
                            status: 'connected',
                            timestamp: new Date().toISOString()
                        }));
                    }
                });
            });
        });
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    debug() {
        houseLog.info('Estado actual', {
            lastUpdate: this.lastUpdate instanceof Date ? this.lastUpdate.toISOString() : null,
            updateInterval: Boolean(this.updateInterval)
        });
    }
}

// Crear una instancia global cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.deviceManager = new DeviceDataManager();
});