import React from 'react';
import '@mantine/core/styles.css';
import '~/styles/global.css';
import { theme } from '~/styles/theme';
import { Router } from '~router';
import { ScrollArea, Stack, MantineProvider } from '@mantine/core';
import { Navbar } from '~components/navbar';

function IndexPopup() {
  return (
    <MantineProvider theme={theme}>
      <Stack w={370} h={600} gap="xs">
        <Navbar />
        <ScrollArea>
          <Router />
        </ScrollArea>
      </Stack>
    </MantineProvider>
  );
}

export default IndexPopup;
