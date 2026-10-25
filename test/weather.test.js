const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const http = require("http");
const { mapWeatherResponse } = require("../API/Accuweather/mapWeather");
const { app, createWeatherApp } = require("../API/Accuweather/Index");

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

function fakeClient(calls) {
    return {
        async get(url) {
            calls.push(url);
            if (url.includes("currentconditions")) {
                return {
                    data: [{
                        Temperature: { Metric: { Value: 22 } },
                        RealFeelTemperature: { Metric: { Value: 24 } },
                        UVIndex: 3,
                        UVIndexText: "Moderado",
                        WeatherText: "Sol"
                    }]
                };
            }
            if (url.includes("airquality")) return { data: [{ Category: "Buena", Index: 12 }] };
            if (url.includes("alerts")) return { data: [{ Text: "Viento" }] };
            if (url.includes("cities/search")) return { data: [{ LocalizedName: "Guadalajara" }] };
            throw new Error(`unexpected ${url}`);
        }
    };
}

test("weather routes use the injected client and fail closed", async () => {
    const calls = [];
    const appUnderTest = createWeatherApp({ apiKey: "test-key", client: fakeClient(calls) });
    const server = http.createServer(appUnderTest);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const weather = await fetch(`${base}/weather/242560`);
        assert.equal(weather.status, 200);
        const body = await weather.json();
        assert.equal(body.current.weatherText, "Sol");
        assert.equal(body.alerts.length, 1);
        assert.equal(calls.length, 3);

        const search = await fetch(`${base}/location/search?q=Guadalajara`);
        assert.equal(search.status, 200);
        assert.equal((await search.json())[0].LocalizedName, "Guadalajara");

        const broken = createWeatherApp({
            apiKey: "test-key",
            client: { get: async () => { throw new Error("down"); } }
        });
        const errorServer = http.createServer(broken);
        await new Promise((resolve) => errorServer.listen(0, "127.0.0.1", resolve));
        try {
            const failed = await fetch(`http://127.0.0.1:${errorServer.address().port}/weather/1`);
            assert.equal(failed.status, 500);
        } finally {
            await new Promise((resolve) => errorServer.close(resolve));
        }

        const closed = createWeatherApp({ apiKey: "" });
        const closedServer = http.createServer(closed);
        await new Promise((resolve) => closedServer.listen(0, "127.0.0.1", resolve));
        try {
            const denied = await fetch(`http://127.0.0.1:${closedServer.address().port}/weather/1`);
            assert.equal(denied.status, 503);
        } finally {
            await new Promise((resolve) => closedServer.close(resolve));
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
