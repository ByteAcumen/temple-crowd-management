module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
        jest: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        // Error Prevention
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',

        // Code Quality
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'warn',
        'no-duplicate-imports': 'error',

        // Style (relaxed for existing codebase)
        'semi': ['warn', 'always'],
        'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
        'indent': ['warn', 4, { SwitchCase: 1 }],
        'comma-dangle': ['warn', 'never'],

        // Node.js
        'no-process-exit': 'off',
        'handle-callback-err': 'warn'
    },
    ignorePatterns: [
        'node_modules/',
        'coverage/',
        'logs/',
        '*.min.js'
    ]
};
