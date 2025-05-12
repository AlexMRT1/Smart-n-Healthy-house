class ReportForm {
    constructor() {
        this.form = document.getElementById('report-form');
        this.setupEventListeners();
        this.socket = io('http://localhost:3000');
    }

    setupEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.form);
        const reportData = {
            title: formData.get('title'),
            type: formData.get('type'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            date: new Date().toISOString(),
            status: 'sin-resolver'
        };

        try {
            // Enviar por MQTT
            this.socket.emit('publish', {
                topic: '/report-incident',
                message: JSON.stringify(reportData)
            });

            // Redirigir a la página de estado
            window.location.href = '../';
        } catch (error) {
            console.error('Error al enviar el reporte:', error);
        }
    }
}

// Inicializar el formulario
new ReportForm();