// Validacion de registro y contrasena

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return password.length >= minLength &&
        hasUpperCase &&
        hasSpecialChar &&
        hasNumber;
}

function hasRequiredRegisterFields(fields) {
    const { email, password, nombre, uid } = fields;
    return Boolean(email && password && nombre && uid);
}

function normalizeLocation(location) {
    return {
        country: location?.country || "",
        state: location?.state || "",
        city: location?.city || ""
    };
}

module.exports = {
    validatePassword,
    hasRequiredRegisterFields,
    normalizeLocation
};
