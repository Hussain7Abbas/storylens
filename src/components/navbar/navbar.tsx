import { ActionIcon, Box, Group, Title, Tooltip } from '@mantine/core';
import { IconLogin, IconSettings } from '@tabler/icons-react';

export function Navbar() {
  return (
    <Group
      justify="space-between"
      w="100%"
      px="md"
      py="xs"
      style={{ borderBottom: '1px solid #e5e7eb' }}
    >
      <Title order={4}>Novzella</Title>
      <Group>
        <Tooltip label="Login" withArrow>
          <Box>
            <ActionIcon variant="subtle">
              <IconLogin />
            </ActionIcon>
          </Box>
        </Tooltip>
        <Tooltip label="Settings" withArrow>
          <Box>
            <ActionIcon variant="subtle">
              <IconSettings />
            </ActionIcon>
          </Box>
        </Tooltip>
      </Group>
    </Group>
  );
}
