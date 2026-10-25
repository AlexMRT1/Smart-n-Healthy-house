const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const http = require("http");
const { app, createAuthApp } = require("../API/server/auth0/server/server");
const { createFakeFirestore } = require("./fixtures/fakeFirestore");

function withoutFirebase(run) {
    const previous = {
        key: process.env.FIREBASE_PRIVATE_KEY,
        email: process.env.FIREBASE_CLIENT_EMAIL
    };
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    return Promise.resolve()
        .then(run)
        .finally(() => {
            if (previous.key === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
            else process.env.FIREBASE_PRIVATE_KEY = previous.key;
            if (previous.email === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
            else process.env.FIREBASE_CLIENT_EMAIL = previous.email;
        });
}

test("auth answers health and refuses a body without firebase", async () => {
    await withoutFirebase(async () => {
        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        try {
            const base = `http://127.0.0.1:${server.address().port}`;
            const health = await fetch(`${base}/health`);
            assert.equal(health.status, 200);
            assert.equal((await health.json()).ok, true);

            const rejected = await fetch(`${base}/register`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}"
            });
            assert.equal(rejected.status, 400);

            const unavailable = await fetch(`${base}/register`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    email: "ada@example.com",
                    password: "Secret1!",
                    nombre: "Ada",
                    uid: "uid-1"
                })
            });
            assert.equal(unavailable.status, 503);
            assert.match((await unavailable.json()).message, /Firebase/);
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });
});

test("register uses the injected firestore instead of a live account", async () => {
    const database = createFakeFirestore();
    const injected = createAuthApp({ database: () => database });
    const server = http.createServer(injected);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/register`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "ada@example.com",
                password: "Secret1!",
                nombre: "Ada",
                uid: "uid-injected"
            })
        });
        assert.equal(response.status, 201);
        const stored = database.read("Users", "uid-injected");
        assert.equal(stored.Email, "ada@example.com");
        assert.notEqual(stored.Password, "Secret1!");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
