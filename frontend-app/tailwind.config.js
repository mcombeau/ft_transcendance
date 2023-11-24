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
				online: "#66CC66",
				offline: "#FF6961",
				ingame: "#FFE662",
				wood: "#987654",
				copper: "#DA8A67",
				silver: "#C9C0BB",
				gold: "#FDDE6C",
				diamond: "#DFF7FA",
				platinum: "#E5E4E2",
			},
			fontFamily: {
				sans: ["Roboto Mono", "monospace"],
			},
		},
	},
	plugins: [],
};
