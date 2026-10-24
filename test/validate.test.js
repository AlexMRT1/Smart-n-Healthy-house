const test = require("node:test");
const assert = require("node:assert/strict");
const { validate } = require("../API/server/validate");

test("validate rejects a body that is not an object", () => {
    assert.equal(validate(null, {}).ok, false);
    assert.equal(validate([], { title: { required: true, type: "string" } }).ok, false);
});

test("validate checks required fields and types", () => {
    const missing = validate({}, { title: { required: true, type: "string" } });
    assert.equal(missing.ok, false);
    assert.match(missing.errors[0], /title/);

    const badType = validate({ title: 12 }, { title: { required: true, type: "string" } });
    assert.equal(badType.ok, false);

    const ok = validate({ title: "Humo" }, { title: { required: true, type: "string" } });
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.errors, []);
});
