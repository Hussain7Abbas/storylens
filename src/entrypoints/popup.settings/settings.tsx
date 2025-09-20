import { Button, Container } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
	const { i18n } = useTranslation();

	return (
		<Container p="md" dir="rtl">
			<Button
				onClick={() =>
					i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")
				}
			>
				{i18n.language === "ar" ? "English" : "Arabic"}
			</Button>
		</Container>
	);
}
