const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { mapWeatherResponse } = require("../API/Accuweather/mapWeather");
const { app } = require("../API/Accuweather/Index");

test("weather mapping copies the fields the dashboard reads", () => {
    const current = {
        Temperature: { Metric: { Value: 28 } },
        RealFeelTemperature: { Metric: { Value: 30 } },
        UVIndex: 6,
        UVIndexText: "Alto",
        WeatherText: "Parcialmente nublado",
        Unused: true
    };
    const air = { Category: "Buena", Index: 20 };
    const alerts = [{ Text: "Viento" }, { Text: "Lluvia" }];
    const mapped = mapWeatherResponse(current, air, alerts);

    assert.deepEqual(mapped.current.temperature, current.Temperature);
    assert.equal(mapped.current.uvIndexText, "Alto");
    assert.equal(mapped.current.Unused, undefined);
    assert.equal(mapped.airQuality, air);
    assert.equal(mapped.alerts.length, 2);
});

test("missing weather objects fail instead of inventing values", () => {
    assert.throws(() => mapWeatherResponse(null, {}, []));
    assert.throws(() => mapWeatherResponse(undefined, {}, []));

    const partial = mapWeatherResponse({}, null, []);
    assert.equal(partial.current.weatherText, undefined);
    assert.equal(partial.airQuality, null);
    assert.deepEqual(partial.alerts, []);
});

test("alert lists of any size pass through unchanged", () => {
    for (const size of [0, 1, 25, 100]) {
        const alerts = Array.from({ length: size }, (_, index) => ({ Text: `Alerta ${index}` }));
        const mapped = mapWeatherResponse({
            Temperature: 1,
            RealFeelTemperature: 1,
            UVIndex: 0,
            UVIndexText: "Bajo",
            WeatherText: "Despejado"
        }, { Index: 1 }, alerts);
        assert.equal(mapped.alerts.length, size);
        if (size > 0) {
            assert.equal(mapped.alerts[size - 1].Text, `Alerta ${size - 1}`);
        }
    }
});

test("weather health answers and a missing query does not call AccuWeather", async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);
        assert.equal((await health.json()).ok, true);

        const search = await fetch(`${base}/location/search`);
        assert.equal(search.status === 400 || search.status === 503, true);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
