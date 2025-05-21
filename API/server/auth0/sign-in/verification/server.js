const express = require('express');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

// Add CORS middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Allow requests from your frontend
    credentials: true // Allow credentials (cookies)
}));

app.use(express.json());
app.use(cookieParser());

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: 'verificationsmartnhealthyhouse@outlook.com',
        pass: '5Dn3BAcubdDXg9'
    }
});

// Función para generar código aleatorio de 5 dígitos
function generateVerificationCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Ruta para enviar el código de verificación
app.post('/send-verification', async (req, res) => {
    try {
        // Obtener el email de la cookie
        const userEmail = req.cookies.userEmail;
        
        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'No se encontró el correo electrónico en las cookies'
            });
        }

        const verificationCode = generateVerificationCode();

        const mailOptions = {
            from: 'verificationsmartnhealthyhouse@outlook.com',
            to: userEmail,
            subject: 'Código de Verificación - Smart\'n Healthy House',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Código de Verificación</h2>
                    <p>Tu código de verificación es:</p>
                    <h1 style="color: #4a90e2; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
                    <p>Este código expirará en 10 minutos.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        // Almacenar el código temporalmente (deberías usar una base de datos en producción)
        app.locals.verificationCode = verificationCode;
        
        res.json({ 
            success: true, 
            message: 'Código de verificación enviado'
        });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar el código de verificación'
        });
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});