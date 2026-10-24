const test = require("node:test");
const assert = require("node:assert/strict");
const {
    isToday,
    filterIncidentsForToday,
    incidentFromHttp,
    incidentFromSocket,
    incidentFromMqtt
} = require("../API/server/domain/incidents");

const now = new Date(2026, 9, 23, 18, 0, 0);

test("same local day ignores the clock", () => {
    assert.equal(isToday(new Date(2026, 9, 23, 0, 0, 0), now), true);
    assert.equal(isToday(new Date(2026, 9, 23, 23, 59, 59), now), true);
    assert.equal(isToday(new Date(2026, 9, 22, 23, 59, 59), now), false);
    assert.equal(isToday(new Date(2026, 9, 24, 0, 0, 0), now), false);
    assert.equal(isToday(new Date(2025, 9, 23, 18, 0, 0), now), false);
    assert.equal(isToday(new Date(2024, 1, 29, 12, 0, 0), new Date(2024, 1, 29, 1, 0, 0)), true);
    assert.equal(isToday(new Date(2024, 2, 1, 0, 0, 0), new Date(2024, 1, 29, 23, 0, 0)), false);
    assert.equal(isToday("no-date", now), false);
    assert.equal(isToday(undefined, now), false);
    assert.equal(isToday(null, now), false);
});

test("cleanup keeps today and the original order", () => {
    const incidents = [];
    for (let i = 0; i < 5000; i += 1) {
        const day = i % 5 === 0 ? 23 : 22;
        incidents.push({
            id: i,
            success: i % 2 === 0,
            date: new Date(2026, 9, day, i % 24, 0, 0)
        });
    }

    const kept = filterIncidentsForToday(incidents, now);
    assert.equal(kept.length, 1000);
    assert.deepEqual(kept.map((item) => item.id), incidents.filter((item) => item.id % 5 === 0).map((item) => item.id));
    assert.equal(kept.every((item) => isToday(item.date, now)), true);
});

test("http and socket always stamp now, mqtt keeps an existing date", () => {
    const stamped = new Date(2026, 9, 23, 12, 0, 0);
    const httpIncident = incidentFromHttp({
        title: "Humo",
        success: false,
        date: "old"
    }, stamped);
    const socketIncident = incidentFromSocket({
        title: "Agua",
        success: true,
        date: "old"
    }, stamped);
    const mqttKept = incidentFromMqtt({ title: "Gas", date: "2026-10-23", success: true }, stamped);
    const mqttMissing = incidentFromMqtt({ title: "Gas", success: false }, stamped);
    const mqttBlank = incidentFromMqtt({ title: "Gas", date: "" }, stamped);

    assert.equal(httpIncident.date, stamped);
    assert.equal(httpIncident.success, false);
    assert.equal(httpIncident.title, "Humo");
    assert.equal(socketIncident.date, stamped);
    assert.equal(socketIncident.success, true);
    assert.equal(mqttKept.date, "2026-10-23");
    assert.equal(mqttMissing.date, stamped);
    assert.equal(mqttBlank.date, stamped);
});

test("newest incident stays first across a long queue", () => {
    let incidents = [];
    const start = new Date(2026, 9, 23, 8, 0, 0);

    for (let i = 0; i < 1000; i += 1) {
        const created = incidentFromHttp({ id: i, success: true }, new Date(start.getTime() + i * 1000));
        incidents = [created, ...incidents];
    }

    assert.equal(incidents[0].id, 999);
    assert.equal(incidents[999].id, 0);
    assert.equal(filterIncidentsForToday(incidents, now).length, 1000);
});
