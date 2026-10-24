const test = require("node:test");
const assert = require("node:assert/strict");
const { createHouseApp } = require("../API/server/server");

async function withServer(run) {
    const house = createHouseApp();
    await new Promise((resolve) => house.server.listen(0, "127.0.0.1", resolve));
    try {
        await run(house.server.address().port);
    } finally {
        house.io.close();
        await new Promise((resolve) => house.server.close(resolve));
    }
}

test("the house API answers without MQTT credentials", async () => {
    await withServer(async (port) => {
        const base = `http://127.0.0.1:${port}`;
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);

        const rejected = await fetch(`${base}/report-incident`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "[]"
        });
        assert.equal(rejected.status, 400);

        const created = await fetch(`${base}/report-incident`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: "Humo", success: false })
        });
        assert.equal(created.status, 200);
        const payload = await created.json();
        assert.equal(payload.incident.title, "Humo");
        assert.equal(payload.incident.success, false);

        const status = await fetch(`${base}/status`);
        const body = await status.json();
        assert.equal(body.incidents.length, 1);
        assert.equal(body.sensors.activeSensors, 0);
    });
});
