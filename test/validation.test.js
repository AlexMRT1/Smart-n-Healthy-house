const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const {
    validatePassword,
    hasRequiredRegisterFields,
    normalizeLocation
} = require("../API/server/auth0/server/validation");

const specials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", ",", ".", "?", "\"", ":", "{", "}", "|", "<", ">"];
const rejectedSpecials = ["~", "`", "-", "_", "=", "+", "[", "]", "\\", ";", "'", "/", " "];

test("password accepts only the required mix", () => {
    assert.equal(validatePassword("Abcdef1!"), true);
    assert.equal(validatePassword("Abcdef1"), false);
    assert.equal(validatePassword("abcdef1!"), false);
    assert.equal(validatePassword("Abcdefg!"), false);
    assert.equal(validatePassword("Abcde1!"), false);
    assert.equal(validatePassword("Ábcdef1"), false);
    assert.equal(validatePassword(`Abcdef1${"x".repeat(400)}!`), true);

    for (const symbol of specials) {
        assert.equal(validatePassword(`Abcdef1${symbol}`), true, symbol);
    }

    for (const symbol of rejectedSpecials) {
        assert.equal(validatePassword(`Abcdef1${symbol}`), false, symbol);
    }
});

test("password rejects empty and non strings by the current rules", () => {
    assert.equal(validatePassword(""), false);
    assert.equal(validatePassword("12345678"), false);
    assert.equal(validatePassword("AAAAAAAA"), false);
    assert.equal(hasRequiredRegisterFields({
        email: "a@b.com",
        password: "secret",
        nombre: "Ana",
        uid: "uid-1"
    }), true);

    for (const missing of ["email", "password", "nombre", "uid"]) {
        const fields = {
            email: "a@b.com",
            password: "secret",
            nombre: "Ana",
            uid: "uid-1",
            [missing]: ""
        };
        assert.equal(hasRequiredRegisterFields(fields), false);
    }
});

test("location fills missing pieces with empty strings", () => {
    assert.deepEqual(normalizeLocation(undefined), { country: "", state: "", city: "" });
    assert.deepEqual(normalizeLocation(null), { country: "", state: "", city: "" });
    assert.deepEqual(normalizeLocation({ country: "MX" }), { country: "MX", state: "", city: "" });
    assert.deepEqual(normalizeLocation({
        country: "MX",
        state: "Jalisco",
        city: "Guadalajara",
        extra: "ignore"
    }), {
        country: "MX",
        state: "Jalisco",
        city: "Guadalajara"
    });
});
