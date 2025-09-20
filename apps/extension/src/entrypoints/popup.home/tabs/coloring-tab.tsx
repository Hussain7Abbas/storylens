import {
  Button,
  Group,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';

export function ColoringTab() {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      image: '',
      info: '',
      name: '',
      role: '',
      search: '',
    },
  });

  return (
    <Stack gap="xs">
      <TextInput label={t('coloring.name')} {...form.getInputProps('name')} />
      <Select
        label={t('coloring.role')}
        allowDeselect={false}
        data={['بطل', 'صديق', 'عدو', 'انثى', 'مهارة', 'مدرب', 'طائفة']}
        {...form.getInputProps('role')}
      />
      <TextInput label={t('coloring.info')} {...form.getInputProps('info')} />
      <TextInput label={t('coloring.image')} {...form.getInputProps('image')} />

      <Group mt="md" grow>
        <Button variant="light" color="green.7">
          {t('_.add')}
        </Button>
        <Button variant="light" color="red.7">
          {t('_.delete')}
        </Button>
      </Group>

      <TextInput placeholder={t('_.search')} {...form.getInputProps('search')} />

      <ScrollArea h={150} mt="md">
        <Text ta="center">{t('_.view')}</Text>
      </ScrollArea>
    </Stack>
  );
}
