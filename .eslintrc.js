// Rules reference: http://eslint.org/docs/rules/
module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "mocha": true
    },

    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018
    },

    "overrides": [
        {
            "files": ["**/*.ts", "**/*.tsx"],
            "extends": [
                "plugin:@typescript-eslint/recommended",
            ],
            "rules": {
                "@typescript-eslint/no-parameter-properties": 2,
                "@typescript-eslint/no-explicit-any": 0,
                "@typescript-eslint/no-var-requires": 2,
                "@typescript-eslint/no-non-null-assertion": 2,
                "@typescript-eslint/no-use-before-define": 0,
                "@typescript-eslint/camelcase": 0,
                "@typescript-eslint/no-empty-interface": 2,
                "@typescript-eslint/explicit-function-return-type": 0,
                "@typescript-eslint/ban-ts-ignore": 0,
                "@typescript-eslint/no-inferrable-types": [2, {
                    "ignoreParameters": true,
                    "ignoreProperties": true,
                }]
            }
        }
    ],

    "rules": {
        "@typescript-eslint/interface-name-prefix": [
            "error",
            {
                "prefixWithI": "always"
            }
        ],
    }
}
