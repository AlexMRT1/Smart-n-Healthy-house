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
