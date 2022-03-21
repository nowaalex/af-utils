module.exports = {
    "settings": {
        "import/resolver": "webpack",
    },
    "parser": "babel-eslint",
    "plugins": [ "lodash" ],
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "airbnb-base",
        "plugin:lodash/recommended",
        "prettier"
    ],
    "rules": {
        "quotes": ["warn", "double"],
        "semi": ["error", "always"],
        "react/display-name": [ 0 ],
        "lodash/prefer-lodash-chain": [ 0 ],
        "lodash/prefer-lodash-method": [ 0 ],
        "no-restricted-syntax": [ "error", "WithStatement", "BinaryExpression[operator='in']" ],
        "no-bitwise": [ 0 ],
        "no-underscore-dangle": [ 0 ],
        "no-plusplus": [ 0 ],
        "lines-between-class-members": [ 0 ],
        "one-var": [ 0 ],
        "no-param-reassign": [ 0 ],
        "no-multi-assign": [ 0 ],
        "no-nested-ternary": [ 0 ],
        "import/prefer-default-export": [ 0 ],
        "no-cond-assign": [ 0 ],
        "max-classes-per-file": [ 5 ],
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off"
    }
}