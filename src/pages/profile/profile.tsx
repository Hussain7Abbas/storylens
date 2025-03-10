import {
  Button,
  TextInput,
  Container,
  Group,
  Select,
  NumberInput,
  Center,
  Avatar,
} from '@mantine/core';
import { useForm } from '@mantine/form';

export function ProfilePage() {
  const form = useForm({
    initialValues: {
      name: 'Hussain Abbas',
      age: 20,
      gender: 'ذكر',
      avatar: 'https://images.loremflickr.com/640/480/people',
    },
  });

  return (
    <Container w={370} p="md" dir="rtl">
      <Center>
        <Avatar src={form.values.avatar} size={120} radius={120} />
      </Center>
      <TextInput label="الاسم" {...form.getInputProps('name')} />
      <NumberInput label="العمر" min={0} {...form.getInputProps('age')} />
      <Select
        label="الجنس"
        data={['ذكر', 'انثى']}
        {...form.getInputProps('gender')}
      />
      <Group mt="md" grow>
        <Button variant="light" color="green.7">
          تعديل
        </Button>
        <Button variant="light" color="red.7">
          تغيير كلمة المرور
        </Button>
      </Group>
    </Container>
  );
}
