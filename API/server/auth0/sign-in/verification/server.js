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

// Update email transporter configuration for IONOS
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.com', // IONOS SMTP server
    port: 587, // IONOS SMTP port
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'no-reply@smartnhealthyhouse.com',
        pass: 'W6CtBIgVB6ynns' // Replace with actual password
    },
    tls: {
        rejectUnauthorized: false // Only use during development
    }
});

// Función para generar código aleatorio de 5 dígitos
function generateVerificationCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Ruta para enviar el código de verificación
app.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un correo electrónico'
            });
        }

        const verificationCode = generateVerificationCode();

        const mailOptions = {
            from: {
                name: 'Smart\'n Healthy House',
                address: 'no-reply@smartnhealthyhouse.com'
            },
            to: email,
            subject: 'Código de Verificación - Smart\'n Healthy House',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="text-align: center; margin-bottom: 30px;">
                
            </div>
            <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Verificación de Correo Electrónico</h2>
                <p style="color: #666; margin-bottom: 30px; text-align: center;">Por favor, utiliza el siguiente código para verificar tu cuenta:</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; text-align: center;">
                    <h1 style="color: #4a90e2; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${verificationCode}</h1>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">Este código expirará en 10 minutos por razones de seguridad.</p>
            </div>
            <div style="text-align: center; color: #999; font-size: 12px;">
                <p>Este es un correo automático, por favor no responder.</p>
                <p>© ${new Date().getFullYear()} Smart'n Healthy House. Todos los derechos reservados.</p>
            </div>
        </div>
    `
        };

        await transporter.sendMail(mailOptions);
        
        // Store the verification code with the email
        app.locals.verificationCodes = app.locals.verificationCodes || {};
        app.locals.verificationCodes[email] = {
            code: verificationCode,
            timestamp: Date.now()
        };
        
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

// Add this new endpoint after your existing /send-verification endpoint
app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere email y código'
        });
    }

    const storedVerification = app.locals.verificationCodes?.[email];
    
    if (!storedVerification) {
        return res.status(400).json({
            success: false,
            message: 'No hay código de verificación pendiente'
        });
    }

    // Check if code has expired (10 minutes)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - storedVerification.timestamp > tenMinutes) {
        delete app.locals.verificationCodes[email];
        return res.status(400).json({
            success: false,
            message: 'El código ha expirado'
        });
    }

    if (storedVerification.code === code) {
        // Code is valid
        delete app.locals.verificationCodes[email]; // Clean up used code
        return res.json({
            success: true,
            message: 'Verificación exitosa'
        });
    }

    res.status(400).json({
        success: false,
        message: 'Código incorrecto'
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});