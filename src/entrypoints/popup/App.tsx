import { useState } from "react";
import logo from "@/assets/icon.png";
import "./App.css";
import "@/utils/i18n";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "#imports";
import { Button } from "@/components/button";

function App() {
	const [count, setCount] = useState(0);
	console.log(
		"ff",
		useAppConfig().skipWelcome,
		import.meta.env.WXT_SKIP_WELCOME,
	);
	const { t, i18n } = useTranslation();

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng); // triggers lazy load from JSON
	};

	return (
		<>
			<Button
				onClick={() => changeLanguage(i18n.language === "ar" ? "en" : "ar")}
			>
				{i18n.language === "ar" ? "English" : "Arabic"}
			</Button>
			<p>{t("helloWorld")}dd</p>
			<div>
				<a href="https://wxt.dev" target="_blank" rel="noopener noreferrer">
					<img src={logo} className="logo" alt="WXT logo" />
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
