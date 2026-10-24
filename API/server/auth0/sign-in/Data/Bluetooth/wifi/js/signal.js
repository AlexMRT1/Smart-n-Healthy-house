// Clase visual segun la fuerza de la senal

function classifySignalStrength(strength) {
    if (strength >= 70) return "strength-high";
    if (strength >= 40) return "strength-medium";
    return "strength-low";
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { classifySignalStrength };
}
