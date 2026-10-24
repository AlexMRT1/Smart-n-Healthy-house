import test from "node:test";
import assert from "node:assert/strict";
import {
    buildSetCookie,
    readCookieValue,
    buildDeleteCookie
} from "../API/server/auth0/sign-in/utils/cookieFormat.mjs";

test("cookies round-trip special characters and ignore prefix names", () => {
    const expires = "Fri, 23 Oct 2026 00:00:00 GMT";
    const jar = [
        buildSetCookie("user", "ana", expires).split(";")[0],
        buildSetCookie("userUID", "abc=123; drop", expires).split(";")[0],
        buildSetCookie("note", "niño café", expires).split(";")[0]
    ].join("; ");

    assert.equal(readCookieValue(jar, "user"), "ana");
    assert.equal(readCookieValue(jar, "userUID"), "abc=123; drop");
    assert.equal(readCookieValue(jar, "note"), "niño café");
    assert.equal(readCookieValue(jar, "use"), "");
    assert.equal(readCookieValue(jar, "userU"), "");
    assert.equal(readCookieValue("", "user"), "");
    assert.equal(readCookieValue(null, "user"), "");
});

test("broken encoding and delete cookies stay safe", () => {
    assert.equal(readCookieValue("token=%", "token"), "");
    assert.equal(readCookieValue("empty=", "empty"), "");
    assert.equal(buildDeleteCookie("session"), "session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/");
    assert.match(buildSetCookie("id", "a b", "Thu, 01 Jan 1970 00:00:00 GMT"), /SameSite=Strict/);
    assert.match(buildSetCookie("id", "a b", "Thu, 01 Jan 1970 00:00:00 GMT"), /id=a%20b/);
});
