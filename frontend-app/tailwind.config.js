/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.tsx", "./src/*.tsx", "./src/**/**/*.tsx"],
	theme: {
		extend: {
			colors: {
				sage: "#ECF4D6",
				lightblue: "#9AD0C2",
				teal: "#2D9596",
				darkblue: "#265073",
			},
			fontFamily: {
				sans: ["Roboto Mono", "monospace"],
			},
		},
	},
	plugins: [],
};
