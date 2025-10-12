import {
  ActionIcon,
  Container,
  Group,
  Loader,
  Select,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { ColoringTab, ReplacingTab } from './tabs';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useGetNovels } from '@repo/api/novels.js';
import type { Novel } from '@prisma/client';
import { browser } from '#imports';
import { sendMessage } from '../background/messaging';
import type { currentNovelMeta } from '@/types';
import { NovelForm, type novelFormModes } from './novelForm';
import { IconCrosshair, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import toast from 'react-hot-toast';

export function HomePage() {
  const { t } = useTranslation();
  const [selectedNovel, setSelectedNovel] = useState<Partial<Novel> | undefined>();
  const [currentTabNovel, setCurrentTabNovel] = useState<
    currentNovelMeta | undefined
  >();
  const [mode, setMode] = useState<novelFormModes>();

  // API hooks
  const {
    data: novelsData,
    isLoading: novelsLoading,
    refetch: refetchNovels,
  } = useGetNovels<{
    data: { data: Novel[] };
  }>({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
  });

  useEffect(() => {
    const getCurrentNovel = async () => {
      if (!novelsData?.data?.data) {
        return;
      }
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const currentNovel = await sendMessage('getCurrentNovel', undefined, {
        tabId: tab.id || 0,
      });
      if (currentNovel) {
        setCurrentTabNovel(currentNovel);
        const novel = novelsData?.data?.data?.find(
          (novel: Novel) => novel.name === currentNovel.novelName,
        );
        if (novel) {
          setSelectedNovel(novel);
        } else {
          setSelectedNovel({ name: currentNovel.novelName });
          setMode('add');
        }
        console.log('🔥', 'novel', { novel, currentNovel });
      }
    };
    getCurrentNovel();
  }, [novelsData?.data?.data]);

  return (
    <Container p="md">
      <Stack gap="xs">
        {novelsLoading ? (
          <Loader />
        ) : (
          <Stack gap="xs">
            <Group gap="xs" align="end">
              <Select
                label={t('coloring.novel')}
                placeholder="Select a novel"
                allowDeselect={false}
                data={novelsData?.data?.data?.map((novel: Novel) => ({
                  value: novel.id,
                  label: novel.name,
                }))}
                value={selectedNovel?.id}
                onChange={(value) =>
                  setSelectedNovel(
                    novelsData?.data?.data?.find(
                      (novel: Novel) => novel.id === value,
                    ),
                  )
                }
                required
              />
              <Text flex={1} ta="center">
                {currentTabNovel?.chapter}
              </Text>
            </Group>
            <Group justify="center">
              <ActionIcon
                color="green"
                variant="subtle"
                size="lg"
                onClick={() => {
                  setSelectedNovel(
                    currentTabNovel ? { name: currentTabNovel.novelName } : undefined,
                  );
                  setMode('add');
                }}
              >
                <IconPlus />
              </ActionIcon>
              {selectedNovel && (
                <>
                  <ActionIcon
                    color="blue"
                    variant="subtle"
                    size="lg"
                    onClick={() => {
                      setMode('edit');
                    }}
                  >
                    <IconEdit />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="lg"
                    onClick={() => {
                      setMode('delete');
                    }}
                  >
                    <IconTrash />
                  </ActionIcon>
                  {/* TODO: send RefetchNovels ro content script */}
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    onClick={() => {
                      toast.success('Coming soon');
                    }}
                  >
                    <IconCrosshair />
                  </ActionIcon>
                </>
              )}
            </Group>
          </Stack>
        )}
        {mode !== undefined ? (
          <NovelForm
            refetchNovels={refetchNovels}
            selectedNovel={selectedNovel}
            mode={mode}
            onClose={() => {
              setMode(undefined);
            }}
          />
        ) : (
          selectedNovel && (
            <Tabs defaultValue="coloring" variant="outline">
              <Tabs.List grow>
                <Tabs.Tab value="coloring">{t('tabs.coloring')}</Tabs.Tab>
                <Tabs.Tab value="replacing">{t('tabs.replacing')}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="coloring">
                <ColoringTab selectedNovelId={selectedNovel?.id || ''} />
              </Tabs.Panel>
              <Tabs.Panel value="replacing">
                <ReplacingTab selectedNovelId={selectedNovel?.id || ''} />
              </Tabs.Panel>
            </Tabs>
          )
        )}
      </Stack>
    </Container>
  );
}
