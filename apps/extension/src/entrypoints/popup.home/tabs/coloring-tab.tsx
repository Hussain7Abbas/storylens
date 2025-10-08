import {
  Button,
  Group,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Loader,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useGetKeywords, usePostKeywords } from '@repo/api/keywords.js';
import { useGetKeywordCategories } from '@repo/api/keyword-categories.js';
import { useGetKeywordNatures } from '@repo/api/keyword-natures.js';
import type { Keyword, KeywordCategory, KeywordNature } from '@prisma/client';
import browser from 'webextension-polyfill';

export function ColoringTab({ selectedNovel }: { selectedNovel: string }) {
  const { t } = useTranslation();
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetKeywordCategories<{ data: { data: KeywordCategory[] } }>({
      pagination: { page: 1, pageSize: 100 },
      sorting: { column: 'name', direction: 'asc' },
    });

  const { data: naturesData, isLoading: naturesLoading } = useGetKeywordNatures<{
    data: { data: KeywordNature[] };
  }>({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
  });

  const {
    data: keywordsData,
    isLoading: keywordsLoading,
    refetch: refetchKeywords,
  } = useGetKeywords<{ data: { data: Keyword[] } }>({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
    query: selectedNovel ? { novelId: selectedNovel } : undefined,
  });

  const createKeywordMutation = usePostKeywords({
    mutation: {
      onSuccess: () => {
        refetchKeywords();
        form.reset();
      },
    },
  });

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      categoryId: '',
      natureId: '',
      imageId: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
      categoryId: (value) => (!value ? 'Category is required' : null),
      natureId: (value) => (!value ? 'Nature is required' : null),
    },
  });

  // Update keywords when data changes
  useEffect(() => {
    if (keywordsData?.data) {
      setKeywords(keywordsData.data.data);
    }
  }, [keywordsData]);

  // Send keywords to content script when they change
  useEffect(() => {
    if (keywords.length > 0) {
      sendKeywordsToContentScript(keywords);
    }
  }, [keywords]);

  const sendKeywordsToContentScript = async (keywordsList: Keyword[]) => {
    try {
      const keywordsMap = keywordsList.reduce(
        (acc, keyword) => {
          acc[keyword.id] = keyword;
          return acc;
        },
        {} as Record<string, Keyword>,
      );

      await browser.runtime.sendMessage({
        type: 'UPDATE_KEYWORDS',
        keywords: keywordsMap,
      });
    } catch (error) {
      console.error('Failed to send keywords to content script:', error);
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    if (!selectedNovel) {
      form.setFieldError('novel', 'Please select a novel');
      return;
    }

    createKeywordMutation.mutate({
      data: {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        natureId: values.natureId,
        novelId: selectedNovel,
        imageId: values.imageId || undefined,
      },
    });
  };

  if (keywordsLoading || categoriesLoading || naturesLoading) {
    return <Loader />;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="xs" p="xs">
        <TextInput
          label={t('coloring.name')}
          {...form.getInputProps('name')}
          required
        />

        <Select
          label={t('coloring.category')}
          placeholder="Select category"
          allowDeselect={false}
          data={categoriesData?.data?.data?.map((cat: KeywordCategory) => ({
            value: cat.id,
            label: cat.name,
          }))}
          {...form.getInputProps('categoryId')}
          required
        />

        <Select
          label={t('coloring.nature')}
          placeholder="Select nature"
          allowDeselect={false}
          data={naturesData?.data?.data?.map((nature: KeywordNature) => ({
            value: nature.id,
            label: nature.name,
          }))}
          {...form.getInputProps('natureId')}
          required
        />

        <TextInput
          label={t('coloring.description')}
          {...form.getInputProps('description')}
          required
        />

        <TextInput
          label={t('coloring.image')}
          {...form.getInputProps('imageId')}
          placeholder="Image ID (optional)"
        />

        {createKeywordMutation.isError && (
          <Alert color="red">
            Failed to create keyword: {createKeywordMutation.error?.message}
          </Alert>
        )}

        <Group mt="md" grow>
          <Button
            type="submit"
            variant="light"
            color="green.7"
            loading={createKeywordMutation.isPending}
          >
            {t('_.add')}
          </Button>
        </Group>

        <ScrollArea h={150} mt="md">
          {keywordsLoading ? (
            <Loader />
          ) : keywords.length > 0 ? (
            <Stack gap="xs">
              {keywords.map((keyword) => {
                const category = categoriesData?.data?.data?.find(
                  (cat) => cat.id === keyword.categoryId,
                );
                const nature = naturesData?.data?.data?.find(
                  (nat) => nat.id === keyword.natureId,
                );

                return (
                  <Group
                    key={keyword.id}
                    justify="space-between"
                    p="xs"
                    style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <div>
                      <Text fw={500}>{keyword.name}</Text>
                      <Text size="sm" c="dimmed">
                        {keyword.description}
                      </Text>
                      <Group gap="xs" mt="xs">
                        {category && (
                          <Text size="xs" style={{ color: category.color }}>
                            {category.name}
                          </Text>
                        )}
                        {nature && (
                          <Text size="xs" style={{ color: nature.color }}>
                            {nature.name}
                          </Text>
                        )}
                      </Group>
                    </div>
                  </Group>
                );
              })}
            </Stack>
          ) : (
            <Text ta="center" c="dimmed">
              No keywords found
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </form>
  );
}
