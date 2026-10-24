const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { app } = require("../API/Gemini/main");

test("the assistant serves health without calling Gemini", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);
        assert.equal((await health.json()).ok, true);

        const cleared = await fetch(`${base}/api/clearContext`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}"
        });
        assert.equal(cleared.status, 200);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
