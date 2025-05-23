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
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTA1LTIyVDE3OjA4OjE1LTA1OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTA1LTIyVDE3OjA4OjE1LTA1OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyNC0wNS0yMlQxNzowODoxNS0wNTowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowZWZiOWZlZC1mYmE3LTRjNDctOWE2My1jYjg5ZjExOTU5ZTUiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDowZWZiOWZlZC1mYmE3LTRjNDctOWE2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" 
                    alt="Smart'n Healthy House Logo" 
                    style="width: 100px; height: auto;"
                />
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

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});