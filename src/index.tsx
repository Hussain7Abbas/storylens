import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@/assets/styles/global.css';
import { theme } from '@/assets/styles/theme';
import { MantineProvider } from '@mantine/core';

export default function ReactDOMWrapper(children: React.ReactNode, id: string) {
  const root = document.createElement('div');
  root.id = id;
  document.body.appendChild(root);
  return ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MantineProvider theme={theme}>{children}</MantineProvider>
    </React.StrictMode>,
  );
}
