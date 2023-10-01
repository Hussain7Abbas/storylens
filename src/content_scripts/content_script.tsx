import React from "react";
import ReactDOM from "react-dom/client";
import MyButton from "../components/MyButton";

function ContentScript() {
	return (
		<div className="App">
			<header className="App-header">
				<h1>ContentScript</h1>
				<MyButton>button</MyButton>
			</header>
		</div>
	);
}

const index = document.createElement("div");
index.id = "novzella-content-script";
document.body.appendChild(index);

ReactDOM.createRoot(index).render(
	<React.StrictMode>
		<ContentScript />
	</React.StrictMode>
);




