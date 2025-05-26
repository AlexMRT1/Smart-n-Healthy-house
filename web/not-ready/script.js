document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');

    // Toggle menu hamburguesa
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        
        // Cerrar todos los dropdowns cuando se cierra el menú
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    });

    // Manejo de dropdowns
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-item');
        
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                
                // Cerrar otros dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                    }
                });
                
                dropdown.classList.toggle('active');
            }
        });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });

    // Para dispositivos móviles
    if (window.innerWidth <= 768) {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isActive = this.classList.contains('active');
                
                // Cerrar todos los dropdowns
                dropdowns.forEach(d => {
                    d.classList.remove('active');
                    d.style.display = 'block';
                });
                
                if (!isActive) {
                    // Abrir el dropdown actual
                    this.classList.add('active');
                    
                    // Ocultar otros dropdowns
                    dropdowns.forEach(d => {
                        if (d !== this) {
                            d.style.display = 'none';
                        }
                    });
                }
            });
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                dropdowns.forEach(d => {
                    d.classList.remove('active');
                    d.style.display = 'block';
                });
            }
        });
    }
});