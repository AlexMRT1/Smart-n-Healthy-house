const test = require("node:test");
const assert = require("node:assert/strict");
const {
    CODE_TTL_MS,
    generateVerificationCode,
    assessVerification
} = require("../API/server/auth0/sign-in/verification/codes");

test("codes are five digits inside the public range", () => {
    assert.equal(generateVerificationCode(() => 0), "10000");
    assert.equal(generateVerificationCode(() => 0.999999999), "99999");

    const seen = new Set();
    for (let i = 0; i < 20000; i += 1) {
        const code = generateVerificationCode();
        assert.match(code, /^\d{5}$/);
        const numeric = Number(code);
        assert.equal(numeric >= 10000 && numeric <= 99999, true);
        seen.add(code);
    }

    assert.equal(seen.size > 1000, true);
});

test("verification window, mismatch and reuse", () => {
    const now = 1_700_000_000_000;
    const record = { code: "12345", timestamp: now - CODE_TTL_MS };

    assert.equal(assessVerification({ email: "", code: "12345", record, now }).body.message, "Se requiere email y código");
    assert.equal(assessVerification({ email: "a@b.com", code: "", record, now }).remove, false);
    assert.equal(assessVerification({ email: "a@b.com", code: "12345", record: null, now }).body.message, "No hay código de verificación pendiente");

    const exact = assessVerification({ email: "a@b.com", code: "12345", record, now });
    assert.equal(exact.status, 200);
    assert.equal(exact.remove, true);

    const expired = assessVerification({
        email: "a@b.com",
        code: "12345",
        record,
        now: now + 1
    });
    assert.equal(expired.body.message, "El código ha expirado");
    assert.equal(expired.remove, true);

    const wrong = assessVerification({
        email: "a@b.com",
        code: 12345,
        record,
        now
    });
    assert.equal(wrong.body.message, "Código incorrecto");
    assert.equal(wrong.remove, false);
});

test("a code store drops used and expired entries only", () => {
    const store = {};
    const now = Date.now();

    for (let i = 0; i < 300; i += 1) {
        store[`user${i}@house.test`] = {
            code: generateVerificationCode(() => i / 90000),
            timestamp: i % 2 === 0 ? now : now - CODE_TTL_MS - 5
        };
    }

    for (const [email, record] of Object.entries(store)) {
        const wrong = assessVerification({ email, code: "00000", record, now });
        if (wrong.remove) delete store[email];
    }

    const afterWrong = Object.keys(store).length;
    assert.equal(afterWrong < 300, true);
    assert.equal(Object.values(store).every((item) => now - item.timestamp <= CODE_TTL_MS), true);

    for (const [email, record] of Object.entries({ ...store })) {
        const ok = assessVerification({ email, code: record.code, record, now });
        assert.equal(ok.status, 200);
        if (ok.remove) delete store[email];
    }

    assert.deepEqual(store, {});
});
