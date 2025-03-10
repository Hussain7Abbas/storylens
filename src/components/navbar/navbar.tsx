import { useRoutes } from '@/hooks/useRoutes';
import { ActionIcon, Box, Group, Image, Menu, Title, Tooltip } from '@mantine/core';
import {
  IconChevronRight,
  IconDotsVertical,
  IconDownload,
  IconLogin,
  IconSettings,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';

export function Navbar() {
  const isLoggedIn = true;
  const { go, back, routes } = useRoutes();

  return (
    <Group
      justify="space-between"
      w="100%"
      px="md"
      py="xs"
      style={{ borderBottom: '1px solid #e5e7eb' }}
    >
      <Group>
        <Image src={'/favicon.png'} alt="Logo" width={32} height={32} />
        <Title order={4}>Novzella</Title>
      </Group>

      {routes.length > 1 ? (
        <ActionIcon variant="subtle" onClick={() => back()}>
          <IconChevronRight />
        </ActionIcon>
      ) : (
        <>
          {!isLoggedIn && (
            <Tooltip label="Login" withArrow>
              <Box>
                <ActionIcon variant="subtle">
                  <IconLogin />
                </ActionIcon>
              </Box>
            </Tooltip>
          )}
          {isLoggedIn && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <IconDotsVertical />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>User</Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={14} />}
                  onClick={() => go('profile')}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => go('settings')}
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
          )}
        </>
      )}
    </Group>
  );
}
