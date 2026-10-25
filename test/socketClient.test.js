const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { parseSocketUpdate, reconnectPlan } = require("../WWW/Dashboard/scripts/socketClient");

test("socket messages keep only a real payload", () => {
    const message = { temperature: 22, gas: true };
    assert.deepEqual(parseSocketUpdate({ message }), message);
    assert.equal(parseSocketUpdate(null), null);
    assert.equal(parseSocketUpdate("hola"), null);
    assert.equal(parseSocketUpdate([]), null);
    assert.equal(parseSocketUpdate({}), null);
    assert.equal(parseSocketUpdate({ message: "text" }), null);
    assert.equal(parseSocketUpdate({ message: [] }), null);
});

test("reconnect stops at the attempt limit", () => {
    assert.deepEqual(reconnectPlan(0, 5), { shouldReconnect: true, attempts: 1 });
    assert.deepEqual(reconnectPlan(4, 5), { shouldReconnect: true, attempts: 5 });
    assert.deepEqual(reconnectPlan(5, 5), { shouldReconnect: false, attempts: 5 });
});
