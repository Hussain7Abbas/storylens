import {
  Button,
  TextInput,
  Group,
  ScrollArea,
  Text,
  Stack,
  Select,
  Loader,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  useGetReplacementsKeywordByKeywordId,
  usePostReplacements,
} from '@repo/api/replacements.js';
import { useGetKeywords } from '@repo/api/keywords.js';
import type { Replacement, Keyword } from '@prisma/client';
import browser from 'webextension-polyfill';

export function ReplacingTab({ selectedNovel }: { selectedNovel: string }) {
  const { t } = useTranslation();
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [replacements, setReplacements] = useState<Replacement[]>([]);

  const { data: keywordsData, isLoading: keywordsLoading } = useGetKeywords<{
    data: { data: Keyword[] };
  }>({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
    query: selectedNovel ? { novelId: selectedNovel } : undefined,
  });

  const {
    data: replacementsData,
    isLoading: replacementsLoading,
    refetch: refetchReplacements,
  } = useGetReplacementsKeywordByKeywordId<{ data: { data: Replacement[] } }>(
    selectedKeyword,
    {
      pagination: { page: 1, pageSize: 100 },
      sorting: { column: 'replacement', direction: 'asc' },
    },
    {
      query: {
        enabled: !!selectedKeyword,
      },
    },
  );

  const createReplacementMutation = usePostReplacements({
    mutation: {
      onSuccess: () => {
        refetchReplacements();
        form.reset();
      },
    },
  });

  const form = useForm({
    initialValues: {
      replacement: '',
    },
    validate: {
      replacement: (value) => (!value ? 'Replacement text is required' : null),
    },
  });

  // Update replacements when data changes
  useEffect(() => {
    if (replacementsData?.data) {
      setReplacements(replacementsData.data.data);
    }
  }, [replacementsData]);

  // Send replacements to content script when they change
  useEffect(() => {
    if (replacements.length > 0) {
      sendReplacementsToContentScript(replacements);
    }
  }, [replacements]);

  const sendReplacementsToContentScript = async (replacementsList: Replacement[]) => {
    try {
      const replacementsMap = replacementsList.reduce(
        (acc, replacement) => {
          acc[replacement.id] = replacement;
          return acc;
        },
        {} as Record<string, Replacement>,
      );

      await browser.runtime.sendMessage({
        type: 'UPDATE_REPLACEMENTS',
        replacements: replacementsMap,
      });
    } catch (error) {
      console.error('Failed to send replacements to content script:', error);
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    if (!selectedKeyword) {
      form.setFieldError('keyword', 'Please select a keyword');
      return;
    }

    createReplacementMutation.mutate({
      data: {
        replacement: values.replacement,
        keywordId: selectedKeyword,
      },
    });
  };

  if (keywordsLoading) {
    return <Loader />;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="xs" p="xs">
        <Select
          label="Select Keyword"
          placeholder="Select a keyword"
          allowDeselect={false}
          data={keywordsData?.data?.data?.map((keyword: Keyword) => ({
            value: keyword.id,
            label: keyword.name,
          }))}
          value={selectedKeyword}
          onChange={(value) => setSelectedKeyword(value || '')}
          disabled={!selectedNovel}
          required
        />

        <TextInput
          label={t('replaces.replaceWith')}
          placeholder="Enter replacement text"
          {...form.getInputProps('replacement')}
          required
        />

        {createReplacementMutation.isError && (
          <Alert color="red">
            Failed to create replacement: {createReplacementMutation.error?.message}
          </Alert>
        )}

        <Group mt="md" grow>
          <Button
            type="submit"
            variant="light"
            color="green.7"
            loading={createReplacementMutation.isPending}
            disabled={!selectedKeyword}
          >
            {t('_.add')}
          </Button>
        </Group>

        <ScrollArea h={150} mt="md">
          {replacementsLoading ? (
            <Loader />
          ) : replacements.length > 0 ? (
            <Stack gap="xs">
              {replacements.map((replacement) => (
                <Group
                  key={replacement.id}
                  justify="space-between"
                  p="xs"
                  style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <Text>{replacement.replacement}</Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text ta="center" c="dimmed">
              No replacements found
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </form>
  );
}
