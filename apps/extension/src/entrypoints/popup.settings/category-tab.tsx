import type { KeywordCategory } from '@prisma/client';
import { Group, Paper, Stack, Text } from '@mantine/core';
import { useGetKeywordCategories } from '@repo/api/keyword-categories.js';
import { DataTable } from 'mantine-datatable';
import { useTranslation } from 'react-i18next';
import { useDataTable } from '@/hooks/use-datatable';
import type { QueryObserverResult } from '@tanstack/react-query';
import { useSetState } from '@mantine/hooks';
import { useEffect } from 'react';
import { SearchInput } from '@/components/search-input';

export function CategoryTab() {
  const { t } = useTranslation();

  const [query, setQuery] = useSetState<{ search: string }>({
    search: '',
  });

  const { pagination, sorting, setPagination, getTableProps } = useDataTable();
  useEffect(() => setPagination({ page: 1 }), [query]);

  const categories = useGetKeywordCategories<{
    data: { data: KeywordCategory[]; total: number };
  }>({
    pagination,
    sorting,
  });

  const tableProps = getTableProps({
    query: categories as unknown as QueryObserverResult<
      { total: number; data: KeywordCategory[] },
      unknown
    >,
  });

  return (
    <Stack p="md">
      <SearchInput
        value={query.search || ''}
        onChange={(value) => setQuery({ search: value as string })}
        variant="default"
      />
      <DataTable
        {...tableProps}
        noRecordsText={t('category.noRecords')}
        columns={[
          { accessor: 'name', title: 'Name' },
          { accessor: 'color', title: 'Color' },
        ]}
      />
    </Stack>
  );
}

export function CategoryCard({ category }: { category: KeywordCategory }) {
  return (
    <Paper withBorder p="md" radius="lg">
      <Group>
        <Text>{category.name}</Text>
        <Text>{category.color}</Text>
      </Group>
    </Paper>
  );
}
