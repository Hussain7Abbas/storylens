import '@/utils/i18n';
import '@mantine/core/styles.css';
import '@/styles/global.css';
import './App.css';
import { ColorSchemeScript, MantineProvider, ScrollArea, Stack } from '@mantine/core';

import { Navbar } from '@/components/navbar';
import { Router } from './routers';

function App({ type = 'popup' }: { type: 'popup' | 'options' }) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider defaultColorScheme="auto">
        <Stack
          h={type === 'popup' ? '30rem' : '100vh'}
          w={type === 'popup' ? '20rem' : '100vw'}
          gap="xs"
        >
          <Navbar />
          <ScrollArea>
            <Router />
          </ScrollArea>
        </Stack>
      </MantineProvider>
    </>
  );
}

export default App;
