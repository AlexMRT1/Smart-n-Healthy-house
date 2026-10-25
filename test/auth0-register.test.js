const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const http = require("http");
const { createAuthApp } = require("../API/server/auth0/server/server");
const { createFakeFirestore } = require("./fixtures/fakeFirestore");

function listen(app) {
    const server = http.createServer(app);
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve(server));
    });
}

test("social login, lookup and face data stay inside the fake firestore", async () => {
    const database = createFakeFirestore();
    const app = createAuthApp({
        database: () => database,
        locate: async () => ({ country: "Mexico", state: "Jalisco", city: "Guadalajara" })
    });
    const server = await listen(app);
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const created = await fetch(`${base}/social-auth`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                uid: "ada",
                email: "ada@example.com",
                nombre: "Ada",
                photoURL: "https://example.test/ada.png"
            })
        });
        assert.equal(created.status, 200);
        assert.equal(database.read("Users", "ada").Nombre, "Ada");
        assert.equal(database.read("Users", "ada").location.city, "Guadalajara");

        const again = await fetch(`${base}/social-auth`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ uid: "ada", email: "other@example.com", nombre: "Other" })
        });
        assert.equal(again.status, 200);
        assert.equal(database.read("Users", "ada").Email, "ada@example.com");

        const missing = await fetch(`${base}/verify-user/nobody`);
        assert.equal((await missing.json()).exists, false);
        const present = await fetch(`${base}/verify-user/ada`);
        assert.equal((await present.json()).exists, true);

        const absentFace = await fetch(`${base}/save-face-data`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ uid: "nobody", faceImage: "abc" })
        });
        assert.equal(absentFace.status, 404);

        const saved = await fetch(`${base}/save-face-data`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ uid: "ada", faceImage: "abc", faceData: "points" })
        });
        assert.equal(saved.status, 200);
        assert.equal(database.read("Users", "ada").UserImg, "abc");
        assert.equal(database.read("Users", "ada").faceData, "points");

        const weak = await fetch(`${base}/register`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "ada@example.com",
                password: "short",
                nombre: "Ada",
                uid: "ada-2"
            })
        });
        assert.equal(weak.status, 400);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
