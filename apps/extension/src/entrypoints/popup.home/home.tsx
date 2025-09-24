import { Container, Loader, Tabs, Text } from '@mantine/core';
import { ColoringTab, ReplacingTab } from './tabs';
import { useTranslation } from 'react-i18next';
import { useGetKeywords } from '@repo/api/keywords.js';
import type { Keyword } from '@prisma/client';

export function HomePage() {
  const { t } = useTranslation();
  const { isLoading, data } = useGetKeywords<{ data: { data: Keyword[] } }>({
    page: '2',
    limit: '5',
  });

  return (
    <Container p="md">
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
      {isLoading && <Loader />}
      {data?.data?.data?.map((keyword) => (
        <Text key={keyword.id}>{keyword.name}</Text>
      ))}
    </Container>
  );
}
