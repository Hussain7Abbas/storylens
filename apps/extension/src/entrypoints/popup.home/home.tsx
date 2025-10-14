import {
  ActionIcon,
  Container,
  Group,
  Menu,
  Select,
  Skeleton,
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
import {
  IconCrosshair,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import type { TFunction } from 'i18next';

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
        <Stack gap={0}>
          {novelsLoading ? (
            <Skeleton height={40} animate />
          ) : (
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
                searchable
              />
              <Text flex={1} ta="center">
                {currentTabNovel?.chapter}
              </Text>
              <NovelMenu
                currentTabNovel={currentTabNovel}
                setSelectedNovel={setSelectedNovel}
                setMode={setMode}
                t={t}
              />
            </Group>
          )}

          {selectedNovel && (
            <Tabs defaultValue="coloring" variant="outline">
              <Stack
                gap="xs"
                pos="sticky"
                top={0}
                style={{ zIndex: 1 }}
                pt="xs"
                styles={{
                  root: {
                    backgroundColor: 'var(--mantine-color-body)',
                  },
                }}
              >
                <Tabs.List grow>
                  <Tabs.Tab value="coloring">{t('tabs.coloring')}</Tabs.Tab>
                  <Tabs.Tab value="replacing">{t('tabs.replacing')}</Tabs.Tab>
                </Tabs.List>
              </Stack>
              <Tabs.Panel value="coloring">
                <ColoringTab selectedNovelId={selectedNovel?.id || ''} />
              </Tabs.Panel>
              <Tabs.Panel value="replacing">
                <ReplacingTab selectedNovelId={selectedNovel?.id || ''} />
              </Tabs.Panel>
            </Tabs>
          )}
        </Stack>
      )}
    </Container>
  );
}

function NovelMenu({
  currentTabNovel,
  setSelectedNovel,
  setMode,
  t,
}: {
  currentTabNovel: currentNovelMeta | undefined;
  setSelectedNovel: (novel: Partial<Novel> | undefined) => void;
  setMode: (mode: novelFormModes) => void;
  t: TFunction;
}) {
  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="transparent">
          <IconDotsVertical />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconPlus size={14} color="green" />}
          onClick={() => {
            setSelectedNovel(
              currentTabNovel ? { name: currentTabNovel.novelName } : undefined,
            );
            setMode('add');
          }}
        >
          {t('novels.add')}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconEdit size={14} color="blue" />}
          onClick={() => {
            setMode('edit');
          }}
        >
          {t('novels.edit')}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash size={14} color="red" />}
          onClick={() => {
            setMode('delete');
          }}
        >
          {t('novels.delete')}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconCrosshair size={14} color="gray" />}
          onClick={() => {
            toast.success('Coming soon');
          }}
        >
          {t('novels.applyKeywordsAndReplacements')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
