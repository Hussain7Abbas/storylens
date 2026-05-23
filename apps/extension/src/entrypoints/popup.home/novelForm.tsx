import {
  Alert,
  Button,
  FileInput,
  Group,
  Paper,
  Stack,
  TagsInput,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Novel } from '@prisma/client';
import {
  useDeleteNovelsById,
  usePostNovels,
  usePutNovelsById,
} from '@repo/api/novels.js';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export type novelFormModes = 'add' | 'edit' | 'delete' | undefined;

export function NovelForm({
  selectedNovel,
  refetchNovels,
  mode = 'add',
  onClose,
}: {
  selectedNovel?: Partial<Novel>;
  mode?: novelFormModes;
  refetchNovels?: () => void;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      imageId: '',
      slugs: [] as string[],
    },
  });

  useEffect(() => {
    form.setValues({
      name: selectedNovel?.name || '',
      description: selectedNovel?.description || '',
      imageId: selectedNovel?.imageId || '',
      slugs: selectedNovel?.slugs || [],
    });
  }, [selectedNovel]);

  const createNovelMutation = usePostNovels({
    mutation: {
      onSuccess: () => {
        toast.success(t('home.novelAddedSuccessfully'));
        form.reset();
        refetchNovels?.();
        onClose?.();
      },
      onError: () => {
        toast.error(t('home.novelAddedFailed'));
      },
    },
  });

  const updateNovelMutation = usePutNovelsById({
    mutation: {
      onSuccess: () => {
        toast.success(t('home.novelUpdatedSuccessfully'));
        form.reset();
        refetchNovels?.();
        onClose?.();
      },
      onError: () => {
        toast.error(t('home.novelUpdatedFailed'));
      },
    },
  });

  const deleteNovelMutation = useDeleteNovelsById({
    mutation: {
      onSuccess: () => {
        toast.success(t('home.novelDeletedSuccessfully'));
        refetchNovels?.();
        onClose?.();
      },
      onError: () => {
        toast.error(t('home.novelDeletedFailed'));
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    if (mode === 'add') {
      createNovelMutation.mutate({
        data: {
          name: values.name,
          description: values.description || undefined,
          imageId: values.imageId || undefined,
          slugs: values.slugs,
        },
      });
    } else if (mode === 'edit') {
      updateNovelMutation.mutate({
        id: selectedNovel?.id || '',
        data: {
          name: values.name,
          description: values.description || undefined,
          imageId: values.imageId || undefined,
          slugs: values.slugs,
        },
      });
    }
  };

  const handleDelete = () => {
    if (!selectedNovel?.id) {
      toast.error(t('novels.notFound'));
      return;
    }
    deleteNovelMutation.mutate({
      id: selectedNovel?.id,
    });
  };

  if (mode === 'delete') {
    return (
      <Paper p="xs" withBorder>
        <Stack gap="xs">
          <Alert title="Are you sure you want to delete this novel?" color="red" />
          <Group grow>
            <Button
              variant="outline"
              onClick={onClose}
              loading={deleteNovelMutation.isPending}
            >
              {t('_.cancel')}
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={handleDelete}
              loading={deleteNovelMutation.isPending}
            >
              {t('_.delete')}
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="xs" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xs">
          <TextInput label={t('novels.name')} {...form.getInputProps('name')} />
          <TagsInput
            label={t('novels.slugs')}
            placeholder={t('novels.slugsPlaceholder')}
            {...form.getInputProps('slugs')}
          />
          <TextInput
            label={t('novels.description')}
            {...form.getInputProps('description')}
          />
          <FileInput label={t('novels.image')} {...form.getInputProps('imageId')} />

          <Group grow>
            <Button
              type="button"
              variant="outline"
              loading={createNovelMutation.isPending}
              onClick={onClose}
            >
              {t('_.cancel')}
            </Button>
            <Button type="submit" loading={createNovelMutation.isPending}>
              {t('_.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
