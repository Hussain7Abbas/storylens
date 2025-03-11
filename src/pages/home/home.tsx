import React from 'react';
import { Tabs, Container } from '@mantine/core';
import { ColoringTab, ReplacingTab } from './tabs';

export function HomePage() {
  return (
    <Container dir="rtl">
      <Tabs defaultValue="coloring" variant="outline">
        <Tabs.List grow>
          <Tabs.Tab value="coloring">تلوين</Tabs.Tab>
          <Tabs.Tab value="replacing">استبدال</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="coloring">
          <ColoringTab />
        </Tabs.Panel>
        <Tabs.Panel value="replacing">
          <ReplacingTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
