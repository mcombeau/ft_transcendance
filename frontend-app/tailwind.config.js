/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ["./src/**/*.tsx", "./src/*.tsx", "./src/**/**/*.tsx"],
	theme: {
		extend: {
			colors: {
				sage: "#ECF4D6",
				lightblue: "#9AD0C2",
				teal: "#2D9596",
				darkblue: "#265073",
				darkdarkblue: "#ECF4D6", // sage replaces darkblue
				darkteal: "#23716D", // for teal
				darklightblue: "#173842", // for lightblue
				darksage: "#102330", // darkdarkblue replaces sage
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
	plugins: [require("tailwind-scrollbar-hide")],
};
