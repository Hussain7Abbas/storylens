import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import { BrowserRouter } from "react-router";

export function Main(type: "popup" | "options" = "popup") {
	ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
		<React.StrictMode>
			<BrowserRouter>
				<App type={type} />
			</BrowserRouter>
		</React.StrictMode>,
	);
}

Main();
