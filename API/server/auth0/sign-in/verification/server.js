const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const { generateVerificationCode, assessVerification } = require('./codes');
const { validate } = require('../../../validate');
const { applyApiDefaults } = require('../../../http');
const logger = require('../../../log');

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const app = express();

applyApiDefaults(app, {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    credentials: true
});
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

// Update email transporter configuration for IONOS
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.com', // IONOS SMTP server
    port: 587, // IONOS SMTP port
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'no-reply@smartnhealthyhouse.com',
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: process.env.SMTP_TLS_INSECURE !== 'true'
    }
});

// Ruta para enviar el código de verificación
app.post('/send-verification', async (req, res) => {
    try {
        const check = validate(req.body, {
            email: { required: true, type: 'string' }
        });
        if (!check.ok) {
            return res.status(400).json({
                success: false,
                message: check.errors[0]
            });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un correo electrónico'
            });
        }

        if (!process.env.SMTP_PASS) {
            return res.status(503).json({
                success: false,
                message: 'El correo no esta configurado'
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
        logger.error('verification mail failed', { error: error.message });
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar el código de verificación'
        });
    }
});

// Add this new endpoint after your existing /send-verification endpoint
app.post('/verify-code', (req, res) => {
    const check = validate(req.body, {
        email: { required: true, type: 'string' },
        code: { required: true }
    });
    if (!check.ok) {
        return res.status(400).json({ success: false, message: check.errors[0] });
    }

    const { email, code } = req.body;
    const result = assessVerification({
        email,
        code,
        record: app.locals.verificationCodes?.[email]
    });

    if (result.remove && app.locals.verificationCodes) {
        delete app.locals.verificationCodes[email];
    }

    return res.status(result.status).json(result.body);
});

const PORT = Number(process.env.PORT || 3002);
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info('verification server listening', { port: PORT });
    });
}

module.exports = { app };