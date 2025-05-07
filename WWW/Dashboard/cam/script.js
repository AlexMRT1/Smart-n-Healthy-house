document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const menu = document.querySelector('.fullscreen-menu');
    const menuItems = document.querySelectorAll('.main-menu ul li');
    const roomsLink = document.querySelector('.rooms-link');
    const mainMenu = document.querySelector('.main-menu');
    const roomsMenu = document.querySelector('.rooms-menu');
    let isOpen = false;
    let isRoomsView = false;

    // Ocultar menú de habitaciones al inicio
    gsap.set(roomsMenu, { display: 'none', opacity: 0 });
    gsap.set(mainMenu, { display: 'flex', opacity: 1 });

    const menuTl = gsap.timeline({ paused: true });
    menuTl
        .to(menu, {
            visibility: 'visible',
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut'
        })
        .to(menuItems, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: 'power2.out'
        });

    const hamburgerTl = gsap.timeline({ paused: true });
    hamburgerTl
        .to('.bar:first-child', {
            rotate: 45,
            y: 8,
            duration: 0.4,
            transformOrigin: "center"
        })
        .to('.bar:nth-child(2)', {
            opacity: 0,
            x: -15,
            duration: 0.4
        }, '-=0.4')
        .to('.bar:last-child', {
            rotate: -45,
            y: -8,
            duration: 0.4,
            transformOrigin: "center"
        }, '-=0.4');

    roomsLink.addEventListener('click', (e) => {
        e.preventDefault();
        isRoomsView = true;
        
        gsap.to('.main-menu', {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                mainMenu.style.display = 'none';
                roomsMenu.style.display = 'flex';
                gsap.fromTo('.rooms-menu', 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.3 }
                );
            }
        });
    });

    hamburger.addEventListener('click', () => {
        if (!isOpen) {
            menuTl.play();
            hamburgerTl.play();
            isOpen = true;
        } else {
            if (isRoomsView) {
                gsap.to('.rooms-menu', {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        roomsMenu.style.display = 'none';
                        mainMenu.style.display = 'flex';
                        gsap.to('.main-menu', {
                            opacity: 1,
                            duration: 0.3
                        });
                        isRoomsView = false;
                    }
                });
            } else {
                menuTl.reverse();
                hamburgerTl.reverse();
                isOpen = false;
                
                setTimeout(() => {
                    if (!isOpen) {
                        mainMenu.style.display = 'flex';
                        roomsMenu.style.display = 'none';
                        isRoomsView = false;
                    }
                }, 500);
            }
        }
    });
});

function initializeCamera() {
    const cameraStream = document.querySelector('.camera-stream');
    const errorMessage = document.querySelector('.error-message');
    
    // Intenta cargar la cámara
    cameraStream.onload = function() {
        cameraStream.style.display = 'block';
        errorMessage.style.display = 'none';
    };
    
    cameraStream.onerror = function() {
        cameraStream.style.display = 'none';
        errorMessage.style.display = 'flex';
    };
    
    // Función para reintentar la conexión
    function retryConnection() {
        cameraStream.src = `http://192.168.1.167:81/?timestamp=${new Date().getTime()}`;
    }
    
    // Reintentar cada 5 segundos si hay error
    setInterval(() => {
        if (cameraStream.style.display === 'none') {
            retryConnection();
        }
    }, 5000);
    
    // Intento inicial
    retryConnection();
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeCamera);