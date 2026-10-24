const test = require("node:test");
const assert = require("node:assert/strict");
const metrics = require("../API/server/metrics");

test("metrics count requests, failures and mqtt state", () => {
    const before = metrics.snapshot();
    metrics.hit("POST");
    metrics.fail();
    metrics.setMqtt("connected");
    const after = metrics.snapshot({ sockets: 2 });
    assert.equal(after.requests, before.requests + 1);
    assert.equal(after.posts, before.posts + 1);
    assert.equal(after.errors, before.errors + 1);
    assert.equal(typeof after.uptimeSeconds, "number");
    assert.equal(after.mqtt, "connected");
    assert.equal(after.sockets, 2);
    metrics.setMqtt("disabled");
});
