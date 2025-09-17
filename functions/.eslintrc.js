// Alternative .eslintrc.js - simpler approach
module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: ["eslint:recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: "module",
	},
	ignorePatterns: ["/lib/**/*", "/generated/**/*"],
	plugins: ["@typescript-eslint"],
	rules: {
		quotes: ["error", "double"],
		indent: ["error", 2],
		"no-unused-expressions": [
			"error",
			{
				allowShortCircuit: true,
				allowTernary: true,
				allowTaggedTemplates: true,
			},
		],
	},
};
