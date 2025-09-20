import "@/utils/i18n";
import "@mantine/core/styles.css";
import "@/styles/global.css";
import "./App.css";
import { Center, MantineProvider, ScrollArea, Stack } from "@mantine/core";

import { Navbar } from "@/components/navbar";
import { Router } from "./routers";

function App({ type }: { type: "popup" | "options" }) {
	return (
		<MantineProvider>
			<Center w="100vw" h="100vh">
				<Stack
					h={type === "popup" ? "30rem" : "100vh"}
					w={type === "popup" ? "20rem" : "25rem"}
					gap="xs"
				>
					<Navbar />
					<ScrollArea>
						<Router />
					</ScrollArea>
				</Stack>
			</Center>
		</MantineProvider>
	);
}

export default App;
