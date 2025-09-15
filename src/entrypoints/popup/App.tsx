import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import { browser, useAppConfig } from "#imports";
import { Button } from "@/components/button";

function App() {
	const [count, setCount] = useState(0);
	console.log(
		"ff",
		useAppConfig().skipWelcome,
		import.meta.env.WXT_SKIP_WELCOME,
	);

	return (
		<>
			<Button />
			<p>{browser.i18n.getMessage("helloWorld")}dd</p>
			<div>
				<a href="https://wxt.dev" target="_blank" rel="noopener noreferrer">
					<img src={wxtLogo} className="logo" alt="WXT logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noopener noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>WXT + React</h1>
			<div className="card">
				<button onClick={() => setCount((count) => count + 1)} type="button">
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the WXT and React logos to learn more
			</p>
		</>
	);
}

export default App;
