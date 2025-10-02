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
      website: values.website,
      novel: {
        xpath: values.novelXpath
          ? { value: values.novelXpath, regex: values.novelXpathRegex }
          : null,
        url: values.novelUrl
          ? { value: values.novelUrl, regex: values.novelUrlRegex }
          : null,
      },
      chapter: {
        xpath: values.chapterXpath
          ? { value: values.chapterXpath, regex: values.chapterXpathRegex }
          : null,
        url: values.chapterUrl
          ? { value: values.chapterUrl, regex: values.chapterUrlRegex }
          : null,
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
      novelXpath: existingSelector.novel?.xpath?.value || '',
      novelXpathRegex: existingSelector.novel?.xpath?.regex || '',
      novelUrl: existingSelector.novel?.url?.value || '',
      novelUrlRegex: existingSelector.novel?.url?.regex || '',
      chapterXpath: existingSelector.chapter?.xpath?.value || '',
      chapterXpathRegex: existingSelector.chapter?.xpath?.regex || '',
      chapterUrl: existingSelector.chapter?.url?.value || '',
      chapterUrlRegex: existingSelector.chapter?.url?.regex || '',
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
      {/* Novel Name */}
      {/* XPath */}
      <TextInput
        label={t('nodeSelector.novelXpath')}
        placeholder="/html/body/div[1]/main"
        {...form.getInputProps('novelXpath')}
      />
      <TextInput
        label={t('nodeSelector.novelXpathRegex')}
        placeholder={t('nodeSelector.novelXpathRegex')}
        defaultValue={'.*'}
        {...form.getInputProps('novelXpathRegex')}
      />
      {/* URL */}
      <TextInput
        label={t('nodeSelector.novelUrl')}
        placeholder={t('nodeSelector.novelUrl')}
        {...form.getInputProps('novelUrl')}
      />
      <TextInput
        label={t('nodeSelector.novelUrlRegex')}
        placeholder={t('nodeSelector.novelUrlRegex')}
        defaultValue={'.*'}
        {...form.getInputProps('novelUrlRegex')}
      />

      {/* Chapter */}
      {/* XPath */}
      <TextInput
        label={t('nodeSelector.chapterXpath')}
        placeholder={t('nodeSelector.chapterXpath')}
        {...form.getInputProps('chapterXpath')}
      />
      <TextInput
        label={t('nodeSelector.chapterXpathRegex')}
        placeholder={t('nodeSelector.chapterXpathRegex')}
        defaultValue={'^D*(d+)'}
        {...form.getInputProps('chapterXpathRegex')}
      />
      {/* URL */}
      <TextInput
        label={t('nodeSelector.chapterUrl')}
        placeholder={t('nodeSelector.chapterUrl')}
        {...form.getInputProps('chapterUrl')}
      />
      <TextInput
        label={t('nodeSelector.chapterUrlRegex')}
        placeholder={t('nodeSelector.chapterUrlRegex')}
        defaultValue={'^D*(d+)'}
        {...form.getInputProps('chapterUrlRegex')}
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
