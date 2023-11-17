import "./index.css";
import App from "./App";
import { CookiesProvider } from "react-cookie";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
root.render(
	<CookiesProvider>
		<App />
	</CookiesProvider>
);
