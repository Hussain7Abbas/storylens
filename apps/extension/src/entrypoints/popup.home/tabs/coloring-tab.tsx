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
  const categories = ['شخصية', 'مهارة', 'مكان'];
  const natures = ['بطل', 'صديق', 'عدو', 'انثى', 'مدرب', 'طائفة'];

  const form = useForm({
    initialValues: {
      image: '',
      info: '',
      name: '',
      category: categories[0],
      nature: natures[0],
      search: '',
    },
  });

  return (
    <Stack gap="xs">
      <TextInput label={t('coloring.name')} {...form.getInputProps('name')} />
      <Select
        label={t('coloring.category')}
        allowDeselect={false}
        data={categories}
        {...form.getInputProps('category')}
      />
      <Select
        label={t('coloring.nature')}
        allowDeselect={false}
        data={natures}
        {...form.getInputProps('nature')}
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
