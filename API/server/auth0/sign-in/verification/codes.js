// Codigo de 5 digitos y ventana de 10 minutos

const CODE_TTL_MS = 10 * 60 * 1000;

function generateVerificationCode(rng = Math.random) {
    return Math.floor(10000 + rng() * 90000).toString();
}

function assessVerification({ email, code, record, now = Date.now() }) {
    if (!email || !code) {
        return {
            status: 400,
            remove: false,
            body: {
                success: false,
                message: "Se requiere email y código"
            }
        };
    }

    if (!record) {
        return {
            status: 400,
            remove: false,
            body: {
                success: false,
                message: "No hay código de verificación pendiente"
            }
        };
    }

    if (now - record.timestamp > CODE_TTL_MS) {
        return {
            status: 400,
            remove: true,
            body: {
                success: false,
                message: "El código ha expirado"
            }
        };
    }

    if (record.code === code) {
        return {
            status: 200,
            remove: true,
            body: {
                success: true,
                message: "Verificación exitosa"
            }
        };
    }

    return {
        status: 400,
        remove: false,
        body: {
            success: false,
            message: "Código incorrecto"
        }
    };
}

module.exports = {
    CODE_TTL_MS,
    generateVerificationCode,
    assessVerification
};
