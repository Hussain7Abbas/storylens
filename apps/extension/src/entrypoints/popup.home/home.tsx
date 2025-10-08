import { Container, Loader, Select, Stack, Tabs } from '@mantine/core';
import { ColoringTab, ReplacingTab } from './tabs';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useGetNovels } from '@repo/api/novels.js';
import type { Novel } from '@prisma/client';

export function HomePage() {
  const { t } = useTranslation();
  const [selectedNovel, setSelectedNovel] = useState<string>('');

  // API hooks
  const { data: novelsData, isLoading: novelsLoading } = useGetNovels<{
    data: { data: Novel[] };
  }>({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
  });

  return (
    <Container p="md">
      <Stack gap="xs">
        {novelsLoading ? (
          <Loader />
        ) : (
          <Select
            label={t('coloring.novel')}
            placeholder="Select a novel"
            allowDeselect={false}
            data={novelsData?.data?.data?.map((novel: Novel) => ({
              value: novel.id,
              label: novel.name,
            }))}
            value={selectedNovel}
            onChange={(value) => setSelectedNovel(value || '')}
            required
          />
        )}
        <Tabs defaultValue="coloring" variant="outline">
          <Tabs.List grow>
            <Tabs.Tab value="coloring">{t('tabs.coloring')}</Tabs.Tab>
            <Tabs.Tab value="replacing">{t('tabs.replacing')}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="coloring">
            <ColoringTab selectedNovel={selectedNovel} />
          </Tabs.Panel>
          <Tabs.Panel value="replacing">
            <ReplacingTab selectedNovel={selectedNovel} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
