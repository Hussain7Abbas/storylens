import React from 'react';
import { Button, TextInput, Group, ScrollArea, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
export function ReplacingTab() {
  const form = useForm({
    initialValues: {
      repName: '',
      repWith: '',
      search: '',
    },
  });
  return (
    <>
      <TextInput label="الاسم" {...form.getInputProps('repName')} />
      <TextInput label="استبدال بـ" {...form.getInputProps('repWith')} />

      <Group mt="md" grow>
        <Button variant="light" color="green.7">
          اضافة استبدال
        </Button>
        <Button variant="light" color="red.7">
          حذف استبدال
        </Button>
      </Group>

      <TextInput placeholder="نص البحث" mt="md" />
      <ScrollArea h={150} mt="md">
        <Text ta="center">(عرض الكلمات المستبدلة هنا)</Text>
      </ScrollArea>
    </>
  );
}
