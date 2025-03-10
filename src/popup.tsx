import '@/assets/styles/global.css';
import { Navbar } from '@/components/navbar';
import ReactDOMWrapper from '@/.';
import { Router } from '@/router';
import { ScrollArea, Stack } from '@mantine/core';

function Popup() {
  return (
    <Stack w={370} h={600} gap="xs">
      <Navbar />
      <ScrollArea>
        <Router />
      </ScrollArea>
    </Stack>
  );
}

ReactDOMWrapper(<Popup />, 'novzella-popup');
