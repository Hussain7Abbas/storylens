import { Stack, Loader, Group, Text, type StackProps, Center } from '@mantine/core';
import { getReplacements } from '@repo/api/replacements.js';
import type {
  GetReplacements200DataItem,
  GetReplacementsParams,
} from '@repo/api/schemas';
import type { ReplacingFormModesType } from './replacing-form';
import { useTranslation } from 'react-i18next';
import {
  INFINITE_SCROLL_PAGE_SIZE,
  useInfiniteScrollList,
} from '@/hooks/use-infinite-scroll-list';

interface ReplacingFormProps extends StackProps {
  selectedNovelId: string;
  search: string;
  setReplacement: (replacement: GetReplacements200DataItem) => void;
  setMode: (mode: ReplacingFormModesType) => void;
}

export function ReplacingCards({
  selectedNovelId,
  search,
  setReplacement,
  setMode,
  ...props
}: ReplacingFormProps) {
  const { t } = useTranslation();

  const { items, isLoading, isFetchingNextPage, loadMoreRef } = useInfiniteScrollList<
    GetReplacementsParams,
    GetReplacements200DataItem
  >({
    queryKey: ['replacements', selectedNovelId, { column: 'from', direction: 'asc' }],
    fetchPage: (params, signal) => getReplacements(params, undefined, signal),
    getParams: (page, debouncedSearch) => ({
      pagination: { page, pageSize: INFINITE_SCROLL_PAGE_SIZE },
      sorting: { column: 'from', direction: 'asc' },
      query: {
        novelId: selectedNovelId,
        search: debouncedSearch || undefined,
      },
    }),
    search,
  });

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (items.length === 0) {
    return (
      <Text ta="center" c="dimmed">
        {t('replacing.noReplacements')}
      </Text>
    );
  }

  return (
    <Stack gap="xs" {...props}>
      {items.map((replacement) => (
        <Group
          key={replacement.id}
          justify="space-between"
          p="xs"
          style={{ border: '1px solid #ddd', borderRadius: '4px' }}
          onClick={() => {
            setReplacement(replacement);
            setMode('edit');
          }}
        >
          <div>
            <Text fw={500}>{replacement.from}</Text>
            <Text size="sm" c="dimmed">
              {replacement.to}
            </Text>
          </div>
        </Group>
      ))}
      <div ref={loadMoreRef} />
      {isFetchingNextPage && (
        <Center>
          <Loader size="sm" />
        </Center>
      )}
    </Stack>
  );
}
