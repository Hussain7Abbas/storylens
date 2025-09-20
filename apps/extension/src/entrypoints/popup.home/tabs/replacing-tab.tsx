import { Button, TextInput, Group, ScrollArea, Text, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';

export function ReplacingTab() {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      repName: '',
      repWith: '',
      search: '',
    },
  });

  return (
    <Stack gap="xs">
      <TextInput label={t('replaces.name')} {...form.getInputProps('repName')} />
      <TextInput
        label={t('replaces.replaceWith')}
        {...form.getInputProps('repWith')}
      />

      <Group mt="md" grow>
        <Button variant="light" color="green.7">
          {t('_.add')}
        </Button>
        <Button variant="light" color="red.7">
          {t('_.delete')}
        </Button>
      </Group>

      <TextInput placeholder="نص البحث" mt="md" />
      <ScrollArea h={150} mt="md">
        <Text ta="center">(عرض الكلمات المستبدلة هنا)</Text>
      </ScrollArea>
    </Stack>
  );
}
