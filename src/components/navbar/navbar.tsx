import {
	ActionIcon,
	Box,
	Group,
	Image,
	Menu,
	Title,
	Tooltip,
	useComputedColorScheme,
	useMantineColorScheme,
} from "@mantine/core";
import {
	IconChevronRight,
	IconDotsVertical,
	IconDownload,
	IconLogin,
	IconMoon,
	IconSettings,
	IconSun,
	IconUpload,
	IconUser,
} from "@tabler/icons-react";
import cx from "clsx";
import icon from "@/assets/icon.png";
import { useRoutes } from "@/hooks/useRoutes";
import classes from "./navbar.module.css";

export function Navbar() {
	const isLoggedIn = true;

	return (
		<Group
			justify="space-between"
			w="100%"
			px="md"
			py="xs"
			style={{ borderBottom: "1px solid #e5e7eb" }}
			wrap="nowrap"
		>
			<Group wrap="nowrap">
				<Image src={icon} alt="Logo" width={32} height={32} />
				<Title order={4} flex={1}>
					StoryLens
				</Title>
			</Group>
			{!isLoggedIn && <LoginButton />}
			{isLoggedIn && (
				<Group>
					<ToggleColorScheme />
					<ActionsMenu />
				</Group>
			)}
		</Group>
	);
}

export function LoginButton() {
	return (
		<Tooltip label="Login" withArrow>
			<Box>
				<ActionIcon variant="transparent">
					<IconLogin />
				</ActionIcon>
			</Box>
		</Tooltip>
	);
}

export function ToggleColorScheme() {
	const { setColorScheme } = useMantineColorScheme();
	const computedColorScheme = useComputedColorScheme("light", {
		getInitialValueInEffect: true,
	});

	return (
		<Tooltip label="Toggle Color Scheme" withArrow>
			<ActionIcon
				onClick={() =>
					setColorScheme(computedColorScheme === "light" ? "dark" : "light")
				}
				variant="transparent"
				size="lg"
				aria-label="Toggle color scheme"
			>
				<IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
				<IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
			</ActionIcon>
		</Tooltip>
	);
}

function ActionsMenu() {
	const { go, back, routes } = useRoutes();

	return routes.length > 1 ? (
		<ActionIcon variant="transparent" onClick={() => back()}>
			<IconChevronRight />
		</ActionIcon>
	) : (
		<Menu shadow="md" width={200}>
			<Menu.Target>
				<ActionIcon variant="transparent">
					<IconDotsVertical />
				</ActionIcon>
			</Menu.Target>

			<Menu.Dropdown>
				<Menu.Label>User</Menu.Label>
				<Menu.Item
					leftSection={<IconUser size={14} />}
					onClick={() => go("profile")}
				>
					Profile
				</Menu.Item>
				<Menu.Item
					leftSection={<IconSettings size={14} />}
					onClick={() => go("settings")}
				>
					Settings
				</Menu.Item>

				<Menu.Divider />
				<Menu.Label>Application</Menu.Label>

				<Menu.Item leftSection={<IconDownload size={14} />}>Import</Menu.Item>
				<Menu.Item leftSection={<IconUpload size={14} />}>Export</Menu.Item>
				<Menu.Item color="red" leftSection={<IconUpload size={14} />}>
					Log out
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
