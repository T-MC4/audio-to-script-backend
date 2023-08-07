module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    env: {
        node: true
    },
    parserOptions: { "project": ["./tsconfig.json"] },
    overrides: [
        {
            files: ['src/**/*'],
        },
    ],
    ignorePatterns: ['dist/']
};