import { Button, TextInput, Group, Select, ScrollArea, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
export function ColoringTab() {
  const form = useForm({
    initialValues: {
      name: '',
      role: '',
      info: '',
      image: '',
      search: '',
    },
  });
  return (
    <>
      <TextInput label="الاسم" {...form.getInputProps('name')} />
      <Select
        label="الدور"
        data={['بطل', 'صديق', 'عدو', 'انثى', 'مهارة', 'مدرب', 'طائفة']}
        {...form.getInputProps('role')}
      />
      <TextInput label="وصف" {...form.getInputProps('info')} />
      <TextInput label="الصورة" {...form.getInputProps('image')} />

      <Group mt="md" grow>
        <Button variant="light" color="green.7">
          اضافة شخصية
        </Button>
        <Button variant="light" color="red.7">
          حذف شخصية
        </Button>
      </Group>

      <Text size="sm" ta="center" mt="sm">
        آخر تعديل:
      </Text>
      <TextInput placeholder="نص البحث" {...form.getInputProps('search')} />

      <ScrollArea h={150} mt="md">
        <Text ta="center">(عرض الشخصيات هنا)</Text>
      </ScrollArea>
    </>
  );
}
