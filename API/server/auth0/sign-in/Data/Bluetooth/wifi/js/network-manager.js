class NetworkManager {
    constructor() {
        this.mockNetworks = [
            { ssid: 'Mi Casa WiFi', strength: 90, secured: true },
            { ssid: 'Vecino_5G', strength: 75, secured: true },
            { ssid: 'INFINITUM_XYZ', strength: 60, secured: true },
            { ssid: 'Red Pública', strength: 45, secured: false },
            { ssid: 'IoT_Network', strength: 30, secured: true }
        ];
    }

    createNetworkElement(network) {
        const div = document.createElement('div');
        div.className = 'network-item';
        
        let strengthClass = '';
        if (network.strength >= 70) {
            strengthClass = 'strength-high';
        } else if (network.strength >= 40) {
            strengthClass = 'strength-medium';
        } else {
            strengthClass = 'strength-low';
        }

        div.innerHTML = `
            <div class="network-header">
                <svg class="wifi-icon ${strengthClass}" viewBox="0 0 24 24">
                    <path class="wifi-arc-3" d="M12 21L15.6 16.2C14.6 15.45 13.35 15 12 15C10.65 15 9.4 15.45 8.4 16.2L12 21"/>
                    <path class="wifi-arc-2" d="M12 9C9.3 9 6.81 9.89 4.8 11.4L6.6 13.8C8.1 12.67 9.97 12 12 12C14.03 12 15.9 12.67 17.4 13.8L19.2 11.4C17.19 9.89 14.7 9 12 9"/>
                    <path class="wifi-arc-1" d="M12 3C7.95 3 4.21 4.34 1.2 6.6L3 9C5.5 7.12 8.62 6 12 6C15.38 6 18.5 7.12 21 9L22.8 6.6C19.79 4.34 16.05 3 12 3"/>
                </svg>
                <div class="network-info">
                    <h3 class="network-name">${network.ssid}</h3>
                </div>
                ${network.secured ? `
                    <svg class="security-icon" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                ` : ''}
            </div>
        `;
        
        if (network.secured) {
            div.addEventListener('click', () => {
                const allItems = document.querySelectorAll('.network-item');
                allItems.forEach(item => {
                    if (item !== div) {
                        item.classList.remove('expanded');
                    }
                });
                div.classList.toggle('expanded');
                
                if (!div.querySelector('.password-container')) {
                    const passwordContainer = document.createElement('div');
                    passwordContainer.className = 'password-container';
                    passwordContainer.innerHTML = `
                        <div class="password-input-container">
                            <input type="password" class="password-input" placeholder="Ingresa la contraseña de la red" />
                            <button class="toggle-password" type="button" aria-label="Toggle password visibility">
                                <svg class="eye-icon" viewBox="0 0 24 24" width="24" height="24">
                                    <path class="eye-open" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    <path class="eye-closed" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="button-container">
                            <button class="connect-button">Conectar</button>
                            <button class="cancel-button">Cancelar</button>
                        </div>
                    `;
                    
                    div.appendChild(passwordContainer);

                    // Setup password toggle functionality
                    const toggleBtn = passwordContainer.querySelector('.toggle-password');
                    const passwordInput = passwordContainer.querySelector('.password-input');
                    const eyeIcon = toggleBtn.querySelector('.eye-icon');
                    
                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const type = passwordInput.type === 'password' ? 'text' : 'password';
                        passwordInput.type = type;
                        eyeIcon.classList.toggle('show-password');
                    });

                    // Prevent input click from closing the container
                    passwordInput.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    
                    // Prevent buttons from closing the container
                    const buttons = passwordContainer.querySelectorAll('button');
                    buttons.forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });
                    });
                    
                    const cancelButton = passwordContainer.querySelector('.cancel-button');
                    cancelButton.addEventListener('click', () => {
                        div.classList.remove('expanded');
                    });
                    
                    const connectButton = passwordContainer.querySelector('.connect-button');
                    connectButton.addEventListener('click', () => {
                        const password = passwordInput.value;
                        this.connectToNetwork(network.ssid, password);
                    });
                }
            });
        } else {
            div.addEventListener('click', () => {
                this.connectToNetwork(network.ssid);
            });
        }
        
        return div;
    }

    connectToNetwork(ssid, password = null) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'connection-status';
        document.body.appendChild(statusDiv);
        
        statusDiv.textContent = `Conectando a ${ssid}...`;
        statusDiv.classList.add('visible');
        
        setTimeout(() => {
            if (Math.random() > 0.2) { // Simulación de conexión exitosa (80% de probabilidad)
                statusDiv.textContent = `¡Conectado a ${ssid}!`;
                statusDiv.style.background = 'var(--success-color)';
                
                setTimeout(() => {
                    window.location.href = '/API/server/auth0/sign-in/Data/Bluetooth/wifi/succes/index.html';
                }, 1000);
            } else {
                statusDiv.textContent = `Error al conectar a ${ssid}`;
                statusDiv.style.background = 'var(--error-color)';
                setTimeout(() => {
                    statusDiv.remove();
                }, 3000);
            }
        }, 2000);
    }

    loadNetworks() {
        const container = document.querySelector('.networks-panel');
        container.innerHTML = '';
        
        this.mockNetworks.forEach(network => {
            container.appendChild(this.createNetworkElement(network));
        });
    }
}

const networkManager = new NetworkManager();
networkManager.loadNetworks();
