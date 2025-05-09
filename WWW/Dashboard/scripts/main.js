document.addEventListener('DOMContentLoaded', () => {
    const welcomeToast = document.querySelector('.welcome-toast');
    const errorToast = document.querySelector('.error-toast');
    const spinnerContainer = document.querySelector('.spinner-container');
    const temperatureElement = document.querySelector('.room-temp-container .temperature');
    const roomNameElement = document.querySelector('.room-temp-container .room-name');
    const loaderElement = document.querySelector('.room-temp-container .loader');
    let firstMessageReceived = false;
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    const lastUser = users[users.length - 1];
    const userName = lastUser ? lastUser.name : 'Usuario';
    
    const userNameElement = document.querySelector('#User-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    spinnerContainer.style.display = 'flex';

    if (temperatureElement) {
        temperatureElement.textContent = 'Cargando...';
    }

    if (temperatureElement) {
        temperatureElement.style.display = 'none';
        temperatureElement.setAttribute('data-sensor', 'temperature');
    }
    if (roomNameElement) {
        roomNameElement.style.display = 'none';
    }
    if (loaderElement) {
        loaderElement.style.display = 'flex'; 
    }

    const sensorGrid = document.querySelector('.sensor-grid');
    const roomTemp = document.querySelector('.room-temp-container');
    const widgets = document.querySelector('.widgets-container');

    if (sensorGrid) {
        const sensorTemplate = `
            <div class="sensor-item glass-effect">
                <div class="sensor-icon">🌡️</div>
                <div class="sensor-label">Temperatura</div>
                <div class="sensor-value" data-sensor="temperature">--°</div>
            </div>
            <div class="sensor-item glass-effect">
                <div class="sensor-icon">💧</div>
                <div class="sensor-label">Humedad</div>
                <div class="sensor-value" data-sensor="humidity">--%</div>
            </div>
        `;
        
        if (!sensorGrid.querySelector('[data-sensor="temperature"]')) {
            sensorGrid.insertAdjacentHTML('beforeend', sensorTemplate);
        }
    }

    window.updateSensorValue = (sensorId, value) => {
        const sensorElement = document.querySelector(`[data-sensor="${sensorId}"]`);
        if (sensorElement) {
            if (sensorId === 'temperature') {
                sensorElement.textContent = `${value}°`;
            } else if (sensorId === 'humidity') {
                sensorElement.textContent = `${value}%`;
            } else {
                sensorElement.textContent = value;
            }
        }
    };

    gsap.set([welcomeToast, errorToast], {
        visibility: 'hidden',
        opacity: 0,
        y: -20
    });
    const masterTl = gsap.timeline();
    masterTl
        .fromTo('.welcome-toast', 
            {
                visibility: 'visible',
                opacity: 0,
                y: -50,
                scale: 0.8
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'back.out(1.7)',
                delay: 0.5
            }
        )
        .to('.welcome-toast', {
            opacity: 0,
            y: -30,
            scale: 0.8,
            duration: 0.4,
            delay: 2,
            ease: 'power3.in',
            onComplete: () => {
                gsap.set('.welcome-toast', { visibility: 'hidden' });
            }
        });

    const masterTlExisting = gsap.timeline();
    gsap.set('.spinner-container', {
        autoAlpha: 1
    });

    masterTlExisting
        .to('.spinner-container', {
            autoAlpha: 0,
            duration: 0.5,
            delay: 0.5,
            onComplete: () => {
                document.querySelector('.spinner-container').style.display = 'none';
            }
        })
        .from('.site-container', {
            y: -20,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        })
        .from('.site-title', {
            y: -50,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out'
        }, '-=0.4')
        .from('.hamburger-menu', {
            opacity: 0,
            x: 20,
            duration: 0.5,
            ease: 'power2.out'
        }, '-=0.4')
        .from('.room-temp-container', {
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, '-=0.2')
        .from('.widget', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out'
        }, '-=0.6')
        .from('.toast', {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        }, '-=0.8')
        .to('.toast', {
            autoAlpha: 0,
            y: -20,
            duration: 0.8,
            delay: 2.5,
            ease: 'power3.in'
        })
        .from('.welcome-toast', {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)',
            onStart: () => {
                gsap.set('.welcome-toast', {
                    visibility: 'visible',
                    zIndex: 10000
                });
            }
        }, '-=0.8')
        .to('.welcome-toast', {
            opacity: 0,
            y: -20,
            duration: 0.8,
            delay: 2.5,
            ease: 'power3.in',
            onComplete: () => {
                gsap.set('.welcome-toast', { visibility: 'hidden' });
            }
        });

    setTimeout(() => {
        document.body.classList.remove('preload');
    }, 100);

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
            // Abrir menú
            menuTl.play();
            hamburgerTl.play();
            isOpen = true;
        } else {
            if (isRoomsView) {
                // Volver al menú principal
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
                // Cerrar menú completamente
                menuTl.reverse();
                hamburgerTl.reverse();
                isOpen = false;
                
                // Asegurarse de restablecer todo
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

    // Configuración del toast de error
    const device = document.querySelector('.device');

    // Manejador de click para el dispositivo
    device.addEventListener('click', () => {
        // Mostrar toast de error sin verificar el estado del toast de bienvenida
        gsap.killTweensOf(errorToast); // Detener cualquier animación previa
        
        gsap.set(errorToast, {
            visibility: 'visible',
            y: -20,
            zIndex: 10000
        });

        gsap.to(errorToast, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                setTimeout(() => {
                    gsap.to(errorToast, {
                        opacity: 0,
                        y: -20,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            gsap.set(errorToast, { visibility: 'hidden' });
                        }
                    });
                }, 2000);
            }
        });
    });

    const deviceDots = document.querySelectorAll('.device-dot');
    
    deviceDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Mostrar el toast de error
            const errorToast = document.querySelector('.error-toast');
            gsap.killTweensOf(errorToast);
            
            gsap.set(errorToast, {
                visibility: 'visible',
                y: -20,
                zIndex: 10000
            });

            gsap.to(errorToast, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    setTimeout(() => {
                        gsap.to(errorToast, {
                            opacity: 0,
                            y: -20,
                            duration: 0.3,
                            ease: 'power2.in',
                            onComplete: () => {
                                gsap.set(errorToast, { visibility: 'hidden' });
                            }
                        });
                    }, 2000);
                }
            });
        });
        
        // Añadir efectos hover con GSAP
        dot.addEventListener('mouseenter', () => {
            gsap.to(dot, {
                scale: 1.5,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        dot.addEventListener('mouseleave', () => {
            gsap.to(dot, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Registrar ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Variable para controlar el estado
    let isGridVisible = false;

    // Función para alternar la vista
    const toggleView = (show) => {
        const roomName = document.querySelector('.room-name');

        if (show && !isGridVisible) {
            gsap.to([roomTemp, widgets], {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => {
                    roomTemp.classList.add('hidden');
                    widgets.classList.add('hidden');
                    roomName.classList.add('centered');
                    sensorGrid.classList.add('visible');
                }
            });
            isGridVisible = true;
        } else if (!show && isGridVisible) {
            sensorGrid.classList.remove('visible');
            setTimeout(() => {
                roomTemp.classList.remove('hidden');
                widgets.classList.remove('hidden');
                roomName.classList.remove('centered');
                gsap.to([roomTemp, widgets], {
                    opacity: 1,
                    y: 0,
                    duration: 0.3
                });
            }, 300);
            isGridVisible = false;
        }
    };

    // Observer para scroll
    const scrollObserver = Observer.create({
        target: window,
        type: "scroll,touch,pointer",
        onChange: ({ velocityY }) => {
            if (Math.abs(velocityY) > 50) {
                toggleView(velocityY > 0);
            }
        }
    });

    // Actualizar la función toggleSensors para mejor manejo de estados y animaciones
    const toggleSensors = (show) => {
        if (show && !isGridVisible) {
            // Primero ocultamos los elementos actuales
            gsap.to([roomTemp, widgets], {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    roomTemp.style.display = 'none';
                    widgets.style.display = 'none';
                    
                    // Preparar el grid antes de mostrarlo
                    gsap.set('.sensor-grid', {
                        display: 'grid',
                        visibility: 'visible',
                        opacity: 1
                    });
                    
                    gsap.set('.sensor-item', {
                        opacity: 0,
                        y: 20
                    });
                    
                    // Mostrar grid y animar los elementos
                    sensorGrid.classList.add('visible');
                    
                    gsap.to('.sensor-item', {
                        y: 0,
                        opacity: 1,
                        duration: 0.4,
                        stagger: {
                            amount: 0.3,
                            grid: "auto",
                            from: "start"
                        },
                        ease: 'power2.out'
                    });
                }
            });
            isGridVisible = true;
            
        } else if (!show && isGridVisible) {
            // Animar salida de sensores
            gsap.to('.sensor-item', {
                y: 20,
                opacity: 0,
                duration: 0.3,
                stagger: {
                    amount: 0.2,
                    grid: "auto",
                    from: "end"
                },
                onComplete: () => {
                    sensorGrid.classList.remove('visible');
                    gsap.set('.sensor-grid', {
                        display: 'none',
                        visibility: 'hidden',
                        opacity: 0
                    });
                    
                    roomTemp.style.display = 'flex';
                    widgets.style.display = 'grid';
                    gsap.to([roomTemp, widgets], {
                        opacity: 1,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
            isGridVisible = false;
        }
    };

    // Mejorar la detección del scroll
    let lastScrollTime = Date.now();
    let scrollTimeout;

    window.addEventListener('wheel', (e) => {
        clearTimeout(scrollTimeout);
        const now = Date.now();
        
        if (now - lastScrollTime > 500) { // Prevenir activaciones muy seguidas
            if (Math.abs(e.deltaY) > 30) {
                toggleSensors(e.deltaY > 0);
                lastScrollTime = now;
            }
        }
        
        scrollTimeout = setTimeout(() => {
            lastScrollTime = 0;
        }, 500);
    }, { passive: true });

    // Mejorar el manejo táctil
    let touchStartY;
    let isTouching = false;

    document.addEventListener('touchstart', (e) => {
        if (!isTouching) {
            touchStartY = e.touches[0].clientY;
            isTouching = true;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (isTouching && touchStartY !== null) {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            if (Math.abs(diff) > 50) {
                toggleSensors(diff > 0);
            }
            
            touchStartY = null;
            isTouching = false;
        }
    }, { passive: true });

    // Agregar manejo de teclas de dirección
    document.addEventListener('keydown', (e) => {
        // Solo procesar si es flecha arriba o abajo
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault(); // Prevenir el scroll default
            
            // Determinar dirección
            const goingDown = e.key === 'ArrowDown';
            
            // Si vamos hacia abajo y no está visible el grid, o
            // si vamos hacia arriba y está visible el grid
            if ((goingDown && !isGridVisible) || (!goingDown && isGridVisible)) {
                toggleSensors(goingDown);
            }
        }
    });

    // Remover manejadores antiguos de scroll si existen
    if (typeof scrollObserver !== 'undefined') {
        scrollObserver.kill();
    }
});