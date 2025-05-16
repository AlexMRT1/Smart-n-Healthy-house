document.addEventListener('DOMContentLoaded', function() {
    const threeScene = new ThreeScene('three-container');
    const networkManager = new NetworkManager();
    
    // Initialize networks
    networkManager.loadNetworks();
    
    // Setup refresh button
    const refreshButton = document.querySelector('.refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            const icon = refreshButton.querySelector('.refresh-icon');
            if (icon) {
                icon.classList.add('loading');
                setTimeout(() => {
                    networkManager.loadNetworks();
                    icon.classList.remove('loading');
                }, 1000);
            }
        });
    }
});