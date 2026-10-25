const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const {
    DEFAULT_DEVICE_STATES,
    createSession,
    validateUserName,
    buildContext,
    clearHistory,
    mergeStates,
    runGeneration
} = require("../API/Gemini/domain/assistant");

test("names fall back only for empty or the unknown marker", () => {
    assert.equal(validateUserName(""), "Friend");
    assert.equal(validateUserName(null), "Friend");
    assert.equal(validateUserName("unknown user"), "Friend");
    assert.equal(validateUserName("Unknown user"), "Unknown user");
    assert.equal(validateUserName("  Ana  "), "Ana");
    assert.equal(validateUserName("   "), "");
});

test("context uses the latest states and keeps old keys", () => {
    const session = createSession();
    const previous = session.states;
    session.states = mergeStates(session.states, { temperature: "41°", extra: "ok" });

    assert.equal(previous.temperature, DEFAULT_DEVICE_STATES.temperature);
    assert.equal(session.states.humidity, "22%");
    assert.equal(session.states.extra, "ok");

    const context = buildContext("Ana", session.states, "casa");
    assert.match(context, /Ana/);
    assert.match(context, /41°/);
    assert.match(context, /casa/);
    assert.match(buildContext("unknown user", session.states), /Friend/);
    assert.match(buildContext("Ana", session.states), /default context/);
});

test("generation keeps only the last three lines in the prompt", async () => {
    const session = createSession();
    const prompts = [];
    const model = {
        async generateContent(fullPrompt) {
            prompts.push(fullPrompt);
            return { response: { text: () => `reply ${prompts.length}` } };
        }
    };

    for (let i = 1; i <= 8; i += 1) {
        const result = await runGeneration(session, model, `msg ${i}`, "CTX");
        assert.equal(result.response, `reply ${i}`);
    }

    assert.equal(session.history.length, 16);
    const lastPrompt = prompts[7];
    assert.match(lastPrompt, /msg 8/);
    assert.match(lastPrompt, /reply 7/);
    assert.equal(lastPrompt.includes("msg 1"), false);
    assert.equal(lastPrompt.includes("reply 1"), false);
    assert.equal(lastPrompt.split("Previous messages:")[1].split("|").length <= 3, true);

    clearHistory(session);
    assert.deepEqual(session.history, []);
});

test("a failed model records the user line and returns the error text", async () => {
    const session = createSession();
    const result = await runGeneration(session, {
        async generateContent() {
            throw new Error("quota");
        }
    }, "hola", "CTX");

    assert.equal(result.response, "Error generating response: quota");
    assert.equal(result.fullPrompt, null);
    assert.equal(session.history.length, 1);
    assert.equal(session.history[0].isUser, true);
    assert.equal(session.history[0].content, "hola");
});
