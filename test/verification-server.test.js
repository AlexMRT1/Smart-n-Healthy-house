const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const http = require("http");
const { app } = require("../API/server/auth0/sign-in/verification/server");

test("verification health and mail stay closed without a password", async () => {
    const previous = process.env.SMTP_PASS;
    delete process.env.SMTP_PASS;
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);
        assert.equal((await health.json()).ok, true);

        const missing = await fetch(`${base}/send-verification`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}"
        });
        assert.equal(missing.status, 400);

        const unconfigured = await fetch(`${base}/send-verification`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "ada@example.com" })
        });
        assert.equal(unconfigured.status, 503);

        const code = await fetch(`${base}/verify-code`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "ada@example.com" })
        });
        assert.equal(code.status, 400);
    } finally {
        if (previous === undefined) delete process.env.SMTP_PASS;
        else process.env.SMTP_PASS = previous;
        await new Promise((resolve) => server.close(resolve));
    }
});
