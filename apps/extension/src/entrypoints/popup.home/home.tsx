import { Container, Tabs } from '@mantine/core';
import { ColoringTab, ReplacingTab } from './tabs';
import { useTranslation } from 'react-i18next';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <Container p="md" dir="rtl">
      <Tabs defaultValue="coloring" variant="outline">
        <Tabs.List grow>
          <Tabs.Tab value="coloring">{t('tabs.coloring')}</Tabs.Tab>
          <Tabs.Tab value="replacing">{t('tabs.replacing')}</Tabs.Tab>
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
