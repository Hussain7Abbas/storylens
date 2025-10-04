import { Button, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'mantine-datatable';
import type { websiteSelectors } from '@/types/configs';
import { useGetConfigsByKey, useDeleteConfigsByKey } from '@repo/api/configs.js';
import { useQueryClient } from '@tanstack/react-query';
import { WEBSITES_SELECTORS_KEY } from './constants';

interface NodeSelectorTableProps {
  onEdit: (website: string) => void;
}

export function NodeSelectorTable({ onEdit }: NodeSelectorTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useGetConfigsByKey<{
    data: {
      key: string;
      value: string;
    };
  }>(WEBSITES_SELECTORS_KEY);

  const deleteConfig = useDeleteConfigsByKey({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['configs', WEBSITES_SELECTORS_KEY],
        });
      },
    },
  });

  // Parse selectors from config
  const selectors: websiteSelectors = configData?.data?.value
    ? JSON.parse(configData.data.value)
    : {};

  const tableData = Object.entries(selectors).map(([website, config]) => ({
    website,
    novelXpath: config.novel.xpath?.value || '-',
    novelXpathRegex: config.novel.xpath?.regex || '-',
    novelUrl: config.novel.url?.value || '-',
    novelUrlRegex: config.novel.url?.regex || '-',
    chapterXpath: config.chapter.xpath?.value || '-',
    chapterXpathRegex: config.chapter.xpath?.regex || '-',
    chapterUrl: config.chapter.url?.value || '-',
    chapterUrlRegex: config.chapter.url?.regex || '-',
  }));

  console.log({ tableData, selectors, configData });

  function handleDelete(website: string) {
    const currentSelectors = { ...selectors };
    delete currentSelectors[website];

    // If no websites left, delete the config entirely
    if (Object.keys(currentSelectors).length === 0) {
      deleteConfig.mutate({ key: WEBSITES_SELECTORS_KEY });
    } else {
      // Otherwise update with remaining websites
      queryClient.setQueryData(['configs', WEBSITES_SELECTORS_KEY], {
        key: WEBSITES_SELECTORS_KEY,
        value: JSON.stringify(currentSelectors),
      });
    }
  }

  return (
    <Stack p="md">
      <DataTable
        fetching={isLoading}
        records={tableData}
        noRecordsText={t('dataTable.noRecords')}
        columns={[
          { accessor: 'website', title: t('nodeSelector.website') },
          { accessor: 'novelXpath', title: t('nodeSelector.novelXpath') },
          { accessor: 'novelXpathRegex', title: t('nodeSelector.novelXpathRegex') },
          { accessor: 'novelUrl', title: t('nodeSelector.novelUrl') },
          { accessor: 'novelUrlRegex', title: t('nodeSelector.novelUrlRegex') },
          { accessor: 'chapterXpath', title: t('nodeSelector.chapterXpath') },
          {
            accessor: 'chapterXpathRegex',
            title: t('nodeSelector.chapterXpathRegex'),
          },
          { accessor: 'chapterUrl', title: t('nodeSelector.chapterUrl') },
          { accessor: 'chapterUrlRegex', title: t('nodeSelector.chapterUrlRegex') },
          {
            accessor: 'actions',
            title: t('_.actions'),
            render: (record) => (
              <Group gap="xs">
                <Button size="xs" onClick={() => onEdit(record.website)}>
                  {t('_.edit')}
                </Button>
                <Button
                  size="xs"
                  color="red"
                  onClick={() => handleDelete(record.website)}
                >
                  {t('_.delete')}
                </Button>
              </Group>
            ),
          },
        ]}
      />
    </Stack>
  );
}
