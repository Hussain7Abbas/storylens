import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import type { websiteSelector, websiteSelectors } from '@/types/configs';
import { useGetConfigsByKey, usePutConfigs } from '@repo/api/configs.js';
import { useForm } from '@mantine/form';
import { useQueryClient } from '@tanstack/react-query';
import { WEBSITES_SELECTORS_KEY } from './constants';

interface NodeSelectorFormProps {
  onClose: () => void;
  currentWebsite?: string;
}

export function NodeSelectorForm({ onClose, currentWebsite }: NodeSelectorFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const isEdit = !!currentWebsite;

  // Fetch existing config
  const { data: configData } = useGetConfigsByKey<{
    data: { key: string; value: string };
  }>(isEdit ? WEBSITES_SELECTORS_KEY : '', {
    query: {
      enabled: !!isEdit,
    },
  });

  const form = useForm();

  const updateConfig = usePutConfigs({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['configs', WEBSITES_SELECTORS_KEY],
        });
        onClose();
      },
    },
  });

  function handleSubmit(values: typeof form.values) {
    // Get current selectors or initialize empty object
    const currentSelectors: websiteSelectors = configData?.data?.value
      ? JSON.parse(configData.data.value)
      : {};

    // Update with new website selector
    currentSelectors[values.website] = {
      novel: {
        xpath: values.novelXpath,
        url: values.novelUrl || null,
      },
      chapter: {
        xpath: values.chapterXpath || null,
        url: values.chapterUrl || null,
      },
    };

    // Save to config
    updateConfig.mutate({
      data: {
        key: WEBSITES_SELECTORS_KEY,
        value: JSON.stringify(currentSelectors),
      },
    });
  }

  useEffect(() => {
    console.log({ currentWebsite, configData });
    if (!currentWebsite) {
      return;
    }
    const existingSelector: websiteSelector = configData?.data?.value
      ? JSON.parse(configData.data.value)[currentWebsite]
      : {};
    console.log({
      existingSelectors: JSON.parse(configData?.data?.value || '{}'),
      existingSelector,
    });

    form.setValues({
      website: currentWebsite,
      novelXpath: existingSelector.novel?.xpath || '',
      novelUrl: existingSelector.novel?.url || '',
      chapterXpath: existingSelector.chapter?.xpath || '',
      chapterUrl: existingSelector.chapter?.url || '',
    });
  }, [configData?.data?.value]);

  return (
    <Stack gap="xs">
      <TextInput
        label={t('nodeSelector.website')}
        placeholder="example.com"
        {...form.getInputProps('website')}
        disabled={!!isEdit}
      />
      <TextInput
        label={t('nodeSelector.novelXpath')}
        placeholder="/html/body/div[1]/main"
        {...form.getInputProps('novelXpath')}
      />
      <TextInput
        label={t('nodeSelector.novelUrl')}
        placeholder={t('nodeSelector.optionalRegex')}
        {...form.getInputProps('novelUrl')}
      />
      <TextInput
        label={t('nodeSelector.chapterXpath')}
        placeholder={t('nodeSelector.optionalXpath')}
        {...form.getInputProps('chapterXpath')}
      />
      <TextInput
        label={t('nodeSelector.chapterUrl')}
        placeholder={t('nodeSelector.optionalRegex')}
        {...form.getInputProps('chapterUrl')}
      />
      <Group grow>
        <Button variant="outline" onClick={onClose}>
          {t('_.cancel')}
        </Button>
        <Button
          onClick={() => handleSubmit(form.values)}
          loading={updateConfig.isPending}
        >
          {t('_.save')}
        </Button>
      </Group>
    </Stack>
  );
}
