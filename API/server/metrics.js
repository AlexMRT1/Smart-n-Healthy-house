const counts = {
    requests: 0,
    posts: 0,
    errors: 0
};

function hit(method) {
    counts.requests += 1;
    if (String(method).toUpperCase() === "POST") counts.posts += 1;
}

function fail() {
    counts.errors += 1;
}

function snapshot() {
    return { ...counts };
}

module.exports = { hit, fail, snapshot };
