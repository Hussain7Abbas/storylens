import { Button, Group, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import type { websiteSelectors } from '@/types/configs';
import { useGetConfigsByKey, usePutConfigs } from '@repo/api/configs.js';
import { useForm } from '@mantine/form';
import { WEBSITES_SELECTORS_KEY } from './constants';
import { browser } from '#imports';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface NodeSelectorFormProps {
  onClose: () => void;
  editedWebsite?: string;
}

export function NodeSelectorForm({ onClose, editedWebsite }: NodeSelectorFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEdit) {
      const getActiveTab = async () => {
        const activeTab = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        form.setValues({
          website: new URL(activeTab?.[0].url || '').hostname,
        });
      };
      getActiveTab();
    }
  }, []);

  const isEdit = !!editedWebsite;

  // Fetch existing config
  const { data: configData } = useGetConfigsByKey<{
    data: { key: string; value: string };
  }>(WEBSITES_SELECTORS_KEY);

  const existingSelectors: websiteSelectors = useMemo(
    () => (configData?.data?.value ? JSON.parse(configData.data.value) : {}),
    [configData?.data?.value],
  );

  const form = useForm({
    initialValues: {
      website: editedWebsite || '',
      novelXpath: '',
      novelXpathRegex: '',
      novelUrl: '',
      novelUrlRegex: '',
      chapterXpath: '',
      chapterXpathRegex: '',
      chapterUrl: '',
      chapterUrlRegex: '',
    },
  });

  const updateConfig = usePutConfigs({
    mutation: {
      onSuccess: () => {
        navigate(0);
        toast.success(t('nodeSelector.websiteSavedSuccess'));
        onClose();
      },
      onError: () => {
        toast.error(t('nodeSelector.websiteSavedFailed'));
      },
    },
  });

  function handleSubmit(values: typeof form.values) {
    let newSelectors: websiteSelectors = { ...existingSelectors };

    // Update with new website selector
    newSelectors = {
      ...newSelectors,
      [values.website]: {
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
      },
    };

    console.log('🔥', 'currentSelectors', {
      newSelectors,
    });

    updateConfig.mutate({
      data: {
        key: WEBSITES_SELECTORS_KEY,
        value: JSON.stringify(newSelectors),
      },
    });
  }

  useEffect(() => {
    console.log({ editedWebsite, configData });
    if (!editedWebsite) {
      return;
    }
    const existingSelector = {
      ...existingSelectors[editedWebsite],
    };

    form.setValues({
      website: existingSelector.website,
      novelXpath: existingSelector.novel?.xpath?.value,
      novelXpathRegex: existingSelector.novel?.xpath?.regex,
      novelUrl: existingSelector.novel?.url?.value,
      novelUrlRegex: existingSelector.novel?.url?.regex,
      chapterXpath: existingSelector.chapter?.xpath?.value,
      chapterXpathRegex: existingSelector.chapter?.xpath?.regex,
      chapterUrl: existingSelector.chapter?.url?.value,
      chapterUrlRegex: existingSelector.chapter?.url?.regex,
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
        defaultValue=".*"
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
