import {
  Select,
  Stack,
  TextInput,
  Alert,
  Loader,
  Group,
  Button,
  ActionIcon,
  FileInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  useDeleteKeywordsById,
  usePostKeywords,
  usePutKeywordsById,
} from '@repo/api/keywords.js';
import type { KeywordCategory, KeywordNature } from '@prisma/client';
import { useTranslation } from 'react-i18next';
import { useGetKeywordNatures } from '@repo/api/keyword-natures.js';
import { useGetKeywordCategories } from '@repo/api/keyword-categories.js';
import { IconCategory, IconMasksTheater, IconTrash } from '@tabler/icons-react';
import type { GetKeywords200DataItem, PostKeywordsBodyOne } from '@repo/api/schemas';
import { useQueryClient } from '@tanstack/react-query';

export type ColoringFormModesType = 'add' | 'edit' | undefined;
interface ColoringFormProps extends React.HTMLAttributes<HTMLFormElement> {
  mode: ColoringFormModesType;
  selectedNovelId: string | undefined;
  keyword?: GetKeywords200DataItem;
  onClose: () => void;
}

export function ColoringForm({
  mode,
  selectedNovelId,
  keyword,
  onClose,
  ...props
}: ColoringFormProps) {
  const { t } = useTranslation();
  const form = useForm<PostKeywordsBodyOne>({
    initialValues: {
      novelId: keyword?.novelId || '',
      name: keyword?.name || '',
      description: keyword?.description || '',
      categoryId: keyword?.categoryId || '',
      natureId: keyword?.natureId || '',
      imageId: keyword?.imageId || undefined,
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      description: (value) => (!value ? 'Description is required' : null),
      categoryId: (value) => (!value ? 'Category is required' : null),
      natureId: (value) => (!value ? 'Nature is required' : null),
    },
  });

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

  const queryClient = useQueryClient();

  const createKeywordMutation = usePostKeywords({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['keywords'] });
        form.reset();
        onClose();
      },
    },
  });

  const updateKeywordMutation = usePutKeywordsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['keywords'] });
        form.reset();
        onClose();
      },
    },
  });

  const deleteKeywordMutation = useDeleteKeywordsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['keywords'] });
        form.reset();
        onClose();
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (!selectedNovelId) {
      form.setFieldError('novel', 'Please select a novel');
      return;
    }
    if (mode === 'add') {
      createKeywordMutation.mutate({
        data: {
          ...values,
          novelId: selectedNovelId,
        },
      });
    } else if (mode === 'edit' && keyword?.id) {
      updateKeywordMutation.mutate({
        id: keyword?.id,
        data: values,
      });
    }
  };

  const handleDelete = () => {
    if (keyword?.id) {
      deleteKeywordMutation.mutate({ id: keyword.id });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} {...props}>
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
          leftSection={categoriesLoading ? <Loader /> : <IconCategory />}
          disabled={naturesLoading}
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
          leftSection={naturesLoading ? <Loader /> : <IconMasksTheater />}
          disabled={categoriesLoading}
        />

        <TextInput
          label={t('coloring.description')}
          {...form.getInputProps('description')}
          required
        />

        <FileInput
          label={t('coloring.image')}
          {...form.getInputProps('imageId')}
          placeholder="Image ID (optional)"
        />

        {createKeywordMutation.isError && (
          <Alert color="red">
            Failed to create keyword: {createKeywordMutation.error?.message}
          </Alert>
        )}

        <Group justify="space-between" mt="md">
          <ActionIcon
            variant="transparent"
            color="red"
            size="lg"
            onClick={() => handleDelete()}
          >
            <IconTrash />
          </ActionIcon>
          <Group>
            {' '}
            <Button variant="outline" onClick={onClose}>
              {t('_.cancel')}
            </Button>
            <Button type="submit" loading={createKeywordMutation.isPending}>
              {t('_.save')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
