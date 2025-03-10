import '@/assets/styles/global.css';
import { Box, Button, useMantineColorScheme } from '@mantine/core';
import { Navbar } from '@/components/navbar';
import ReactDOMWrapper from '.';
import { useEffect } from 'react';

function Popup() {
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    setColorScheme('dark');
  }, []);
  return (
    <Box w={350} h={600}>
      <Navbar />
      <Box p="md">
        <Button>Click me</Button>
      </Box>
    </Box>
  );
}

ReactDOMWrapper(<Popup />, 'novzella-popup');
