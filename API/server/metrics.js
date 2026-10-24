const counts = {
    requests: 0,
    posts: 0,
    errors: 0
};

let mqtt = "disabled";

function hit(method) {
    counts.requests += 1;
    if (String(method).toUpperCase() === "POST") counts.posts += 1;
}

function fail() {
    counts.errors += 1;
}

function setMqtt(state) {
    mqtt = state;
}

function snapshot(extra = {}) {
    return {
        ...counts,
        uptimeSeconds: Math.round(process.uptime()),
        mqtt,
        ...extra
    };
}

module.exports = { hit, fail, setMqtt, snapshot };
