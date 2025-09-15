import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	hooks: {
		"build:manifestGenerated": (wxt, manifest) => {
			if (wxt.config.mode === "development") {
				manifest.title += " (DEV)";
			}
		},
	},
	imports: false,
	modules: ["@wxt-dev/module-react"],
	srcDir: "src",

	webExt: {
		binaries: {
			chrome: "/usr/bin/google-chrome",
		},
	},
});
