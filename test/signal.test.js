const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { classifySignalStrength } = require("../API/server/auth0/sign-in/Data/Bluetooth/wifi/js/signal");

test("signal class follows 70 and 40", () => {
    const samples = [
        [100, "strength-high"],
        [70, "strength-high"],
        [69.9, "strength-medium"],
        [40, "strength-medium"],
        [39.9, "strength-low"],
        [0, "strength-low"],
        [-5, "strength-low"]
    ];

    for (const [strength, expected] of samples) {
        assert.equal(classifySignalStrength(strength), expected);
    }

    for (let strength = 0; strength <= 100; strength += 1) {
        const label = classifySignalStrength(strength);
        if (strength >= 70) assert.equal(label, "strength-high");
        else if (strength >= 40) assert.equal(label, "strength-medium");
        else assert.equal(label, "strength-low");
    }
});
