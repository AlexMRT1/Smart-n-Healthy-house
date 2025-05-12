// Configuration
const CONFIG = {
    API_URL: 'http://localhost:3000',
    REFRESH_INTERVAL: 5000,
    STATUS: {
        CHECKING: 'Checking...',
        ONLINE: 'Funcionando',
        OFFLINE: 'Desconectado'
    },
    SOCKET_OPTIONS: {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
    }
};

// State Management
class SystemStateManager {
    constructor() {
        this.state = {
            api: this.createInitialComponentState(),
            database: this.createInitialComponentState(),
            sensors: this.createInitialComponentState(),
            incidents: [] // Iniciar con array vacío
        };
        this.isConnected = false;
    }

    createInitialComponentState() {
        return {
            status: CONFIG.STATUS.CHECKING,
            lastCheck: new Date(),
            responseTime: '--'
        };
    }

    updateState(newState) {
        this.state = {
            ...this.state,
            ...newState
        };
        UIManager.updateAll(this.state);
    }

    addIncident(incident) {
        this.state.incidents.unshift(incident);
        UIManager.handleNewIncident(incident);
    }
}

// API Service
class APIService {
    static socket = null;

    static initializeWebSocket() {
        console.log('🔌 Initializing WebSocket connection...');
        
        // Initialize socket with proper options
        this.socket = io(CONFIG.API_URL, CONFIG.SOCKET_OPTIONS);

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected with ID:', this.socket.id);
            this.fetchStatus().then(({data}) => {
                window.statusMonitor.stateManager.updateState({
                    ...data,
                    incidents: data.incidents || []
                });
                window.statusMonitor.stateManager.isConnected = true;
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            window.statusMonitor.stateManager.isConnected = false;
            window.statusMonitor.handleDisconnection();
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            window.statusMonitor.handleDisconnection();
        });

        this.socket.on('newIncident', (incident) => {
            // No formatear el estado, usar el incidente tal cual viene
            window.statusMonitor.stateManager.addIncident(incident);
        });

        this.socket.on('sensorUpdate', (data) => {
            console.log('Received sensor update:', data);
        });

        this.socket.on('incidentsCleared', () => {
            window.statusMonitor.stateManager.updateState({
                ...window.statusMonitor.stateManager.state,
                incidents: []
            });
            UIManager.handleIncidentsCleared();
        });

        // Solicitar estado inicial
        this.socket.emit('getStatus');
    }

    static async fetchStatus() {
        try {
            const startTime = performance.now();
            const response = await fetch(`${CONFIG.API_URL}/status`);
            const responseTime = Math.round(performance.now() - startTime);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { data, responseTime };
        } catch (error) {
            console.error('Error fetching status:', error);
            throw error;
        }
    }

    static async reportIncident(title, description, success) {
        const incident = {
            title,
            description,
            success, // Mantener el valor exacto que se pasa
            date: new Date().toISOString()
        };

        // Enviar el incidente sin modificar
        this.socket.emit('publish', {
            topic: '/report-incident',
            message: JSON.stringify(incident)
        });

        // Enviar por HTTP también sin modificar
        const response = await fetch(`${CONFIG.API_URL}/report-incident`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(incident)
        });

        if (!response.ok) throw new Error('Error al reportar incidente');
        return response.json();
    }

    static async clearIncidents() {
        try {
            console.log('📝 Sending clear incidents request...');
            const response = await fetch(`${CONFIG.API_URL}/clear-incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('❌ Server responded with status:', response.status);
                throw new Error('Error al limpiar incidentes');
            }

            const data = await response.json();
            console.log('✅ Server response:', data);
            return data;
        } catch (error) {
            console.error('❌ Error in clearIncidents:', error);
            throw error;
        }
    }
}

// UI Management
class UIManager {
    static updateAll(state) {
        this.updateComponents(state);
        this.updateIncidents(state.incidents);
        this.updateSystemStatus();
    }

    static updateComponents(state) {
        ['api', 'db', 'sensors'].forEach(id => {
            this.updateComponentStatus(id, state[id === 'db' ? 'database' : id]);
        });
    }

    static updateComponentStatus(id, data) {
        const statusElem = document.getElementById(`${id}-status`);
        if (!statusElem) return;

        const isOnline = data.status === CONFIG.STATUS.ONLINE;
        statusElem.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        statusElem.textContent = data.status;

        this.updateComponentDetails(id, data);
    }

    static updateComponentDetails(id, data) {
        const details = {
            api: () => {
                this.updateElement('api-last-check', data.lastCheck);
                this.updateElement('api-response-time', data.responseTime);
            },
            db: () => {
                this.updateElement('db-last-check', data.lastCheck);
                this.updateElement('db-connections', data.connections);
            },
            sensors: () => {
                this.updateElement('active-sensors', data.activeSensors);
                this.updateElement('sensors-last-update', data.lastUpdate);
            }
        };

        details[id]?.();
    }

    static updateElement(id, value) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value instanceof Date ? value.toLocaleString() : value;
        }
    }

    static updateIncidents(incidents) {
        const incidentsList = document.getElementById('incidents-list');
        if (!incidentsList) return;

        const currentItems = incidentsList.children.length;

        if (!incidents.length) {
            incidentsList.innerHTML = this.getEmptyIncidentsHTML();
            return;
        }

        incidentsList.innerHTML = incidents.map(this.getIncidentHTML).join('');

        if (incidentsList.children.length > currentItems) {
            this.animateNewIncidents();
        }
    }

    static getEmptyIncidentsHTML() {
        return `
            <div class="incident-item" data-status="normal">
                <h3>Sin incidentes</h3>
                <p>No hay incidentes reportados</p>
            </div>
        `;
    }

    static getIncidentHTML(incident) {
        return `
        <div class="incident-item ${incident.success ? 'resolved' : 'unresolved'}" data-success="${incident.success}">
            <h3>${incident.title}</h3>
            <p>${incident.description}</p>
            <p class="incident-date">${new Date(incident.date).toLocaleString()}</p>
            <p class="incident-status">${incident.success ? 'Resuelto' : 'No resuelto'}</p>
        </div>
    `;
    }

    static handleNewIncident(incident) {
        const incidentsList = document.getElementById('incidents-list');
        if (!incidentsList) return;

        // Si es el primer incidente, limpiar el mensaje de "sin incidentes"
        if (incidentsList.querySelector('[data-success="true"]')) {
            incidentsList.innerHTML = '';
        }

        const newIncidentHtml = this.getIncidentHTML(incident);
        incidentsList.insertAdjacentHTML('afterbegin', newIncidentHtml);

        const newIncident = incidentsList.firstElementChild;
        gsap.from(newIncident, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.out"
        });
    }

    static handleIncidentsCleared() {
        const incidentsList = document.getElementById('incidents-list');
        if (!incidentsList) return;
        
        incidentsList.innerHTML = this.getEmptyIncidentsHTML();
        gsap.from('.incident-item', {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.out"
        });
    }

    static animateNewIncidents() {
        gsap.from('.incident-item', {
            opacity: 0,
            y: 20,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out"
        });
    }

    static updateSystemStatus() {
        const systemStatus = document.querySelector('.status-overview');
        if (!systemStatus) return;

        const allSystems = document.querySelectorAll('.status-indicator');
        const allOperational = Array.from(allSystems)
            .every(indicator => indicator.classList.contains('online'));

        systemStatus.textContent = allOperational 
            ? "Todos los sistemas están operativos"
            : "Algunos sistemas presentan problemas";
        
        gsap.to(systemStatus, {
            color: allOperational ? 'var(--success-color)' : 'var(--error-color)',
            duration: 0.3
        });
    }

    static initializeAnimations() {
        // Adjust initial positions for better flow
        gsap.set(".brand-header", {
            y: -10,
            opacity: 0
        });
        
        gsap.set([".system-status", ".status-card", ".incidents-panel"], {
            opacity: 0,
            y: 20
        });

        // Animate header first
        gsap.to(".brand-header", {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out"
        });

        // Then animate content
        gsap.to([".system-status", ".status-card", ".incidents-panel"], {
            opacity: 1,
            y: 0,
            duration: 0.4,
            delay: 0.2,
            stagger: { amount: 0.3, from: "start" },
            ease: "power2.out"
        });
    }
}

// Main Application
class StatusMonitor {
    constructor() {
        this.stateManager = new SystemStateManager();
        this.setupEventListeners();
        APIService.initializeWebSocket();
        this.setupDevTools();
        
        window.statusMonitor = this;
    }

    setupDevTools() {
        // Exponer el método de limpieza en la consola
        window.clearAllIncidents = async () => {
            try {
                await APIService.clearIncidents();
                console.log('✅ Incidentes limpiados exitosamente');
            } catch (error) {
                console.error('❌ Error al limpiar incidentes:', error);
            }
        };

        // Añadir atajo de teclado (Ctrl+Shift+C) - solo funciona en modo desarrollador
        document.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                await window.clearAllIncidents();
            }
        });
    }

    checkDeveloperMode() {
        // Verificar si estamos en modo desarrollador
        const isDeveloper = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          localStorage.getItem('devMode') === 'true';
        
        if (isDeveloper) {
            document.body.setAttribute('data-mode', 'developer');
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Iniciando sistema de monitoreo...');
            UIManager.initializeAnimations();
            this.monitorStatus();
            
            // Solo configurar el botón si estamos en modo desarrollador
            if (document.body.getAttribute('data-mode') === 'developer') {
                const clearButton = document.getElementById('clear-incidents');
                if (clearButton) {
                    clearButton.addEventListener('click', async () => {
                        try {
                            await APIService.clearIncidents();
                            console.log('Incidentes limpiados exitosamente');
                        } catch (error) {
                            console.error('Error al limpiar incidentes:', error);
                        }
                    });
                }
            }
        });
    }

    async monitorStatus() {
        try {
            const { data, responseTime } = await APIService.fetchStatus();
            const wasOffline = !this.stateManager.isConnected;
            this.stateManager.isConnected = true;

            this.updateOnlineStatus(data, responseTime);
            if (wasOffline) this.handleReconnection();

        } catch (error) {
            console.error('Error fetching status:', error);
            if (this.stateManager.isConnected) {
                this.handleDisconnection();
            }
        } finally {
            setTimeout(() => this.monitorStatus(), CONFIG.REFRESH_INTERVAL);
        }
    }

    updateOnlineStatus(data, responseTime) {
        this.stateManager.updateState({
            api: {
                status: CONFIG.STATUS.ONLINE,
                lastCheck: new Date(),
                responseTime: `${responseTime}ms`
            },
            database: {
                status: CONFIG.STATUS.ONLINE,
                lastCheck: new Date(),
                connections: data.database?.connections || 0
            },
            sensors: {
                status: CONFIG.STATUS.ONLINE,
                activeSensors: data.sensors?.activeSensors || 0,
                lastUpdate: new Date()
            }
        });
    }

    handleReconnection() {
        this.stateManager.addIncident({
            title: 'Conexión restaurada',
            description: 'La conexión con el servidor ha sido restablecida',
            success: true
        });
    }

    handleDisconnection() {
        this.stateManager.isConnected = false;
        this.stateManager.addIncident({
            title: 'Pérdida de conexión',
            description: 'Se perdió la conexión con el servidor',
            success: false
        });

        this.stateManager.updateState({
            api: { ...this.stateManager.state.api, status: CONFIG.STATUS.OFFLINE, responseTime: 'N/A' },
            database: { ...this.stateManager.state.database, status: CONFIG.STATUS.OFFLINE, connections: 0 },
            sensors: { ...this.stateManager.state.sensors, status: CONFIG.STATUS.OFFLINE, activeSensors: 0 }
        });
    }
}

// Initialize application
new StatusMonitor();