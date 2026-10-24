const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: [
            "node_modules/**",
            ".history/**",
            "secrets/**",
            "WWW/**",
            "web/**",
            "API/server/auth0/sign-in/Data/**",
            "API/server/auth0/sign-in/auth.js",
            "API/server/auth0/sign-in/loadEnv.js",
            "API/server/auth0/sign-in/utils/**",
            "API/server/status/**"
        ]
    },
    {
        files: ["API/**/*.js", "test/**/*.js", "scripts/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: globals.node
        },
        rules: {
            ...js.configs.recommended.rules,
            "no-unused-vars": ["error", { args: "none" }]
        }
    }
];
