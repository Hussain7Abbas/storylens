import { Stack, TextInput, Alert, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  usePostReplacements,
  usePutReplacementsById,
} from '@repo/api/replacements.js';
import { useTranslation } from 'react-i18next';
import type {
  GetReplacements200DataItem,
  PostReplacementsBodyOne,
} from '@repo/api/schemas';
import { useQueryClient } from '@tanstack/react-query';

export type ReplacingFormModesType = 'add' | 'edit' | 'delete' | undefined;
interface ReplacingFormProps extends React.HTMLAttributes<HTMLFormElement> {
  mode: ReplacingFormModesType;
  selectedNovelId: string | undefined;
  replacement?: GetReplacements200DataItem;
  onClose: () => void;
}

export function ReplacingForm({
  mode,
  selectedNovelId,
  replacement,
  onClose,
  ...props
}: ReplacingFormProps) {
  const { t } = useTranslation();
  const form = useForm<PostReplacementsBodyOne>({
    initialValues: {
      novelId: replacement?.novelId || '',
      from: replacement?.from || '',
      to: replacement?.to || '',
    },
    validate: {
      from: (value) => (!value ? 'From is required' : null),
      to: (value) => (!value ? 'To is required' : null),
    },
  });

  const queryClient = useQueryClient();

  const createKeywordMutation = usePostReplacements({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['replacements'] });
        form.reset();
      },
    },
  });

  const updateReplacementMutation = usePutReplacementsById({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['replacements'] });
        form.reset();
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
          novelId: selectedNovelId,
          from: values.from,
          to: values.to,
        },
      });
    } else if (mode === 'edit' && replacement?.id) {
      updateReplacementMutation.mutate({
        id: replacement.id,
        data: values,
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} {...props}>
      <Stack gap="xs" p="xs">
        <TextInput
          label={t('replacing.from')}
          {...form.getInputProps('from')}
          required
        />

        <TextInput label={t('replacing.to')} {...form.getInputProps('to')} required />

        {createKeywordMutation.isError && (
          <Alert color="red">
            Failed to create keyword: {createKeywordMutation.error?.message}
          </Alert>
        )}

        <Group grow>
          <Button variant="outline" onClick={onClose}>
            {t('_.cancel')}
          </Button>
          <Button type="submit" loading={createKeywordMutation.isPending}>
            {t('_.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
