import { Stack, Loader, Group, Text, type StackProps, Center } from '@mantine/core';
import { useGetReplacements } from '@repo/api/replacements.js';
import type { GetReplacements200DataItem } from '@repo/api/schemas';
import type { ReplacingFormModesType } from './replacing-form';

interface ReplacingFormProps extends StackProps {
  selectedNovelId: string;
  setReplacement: (replacement: GetReplacements200DataItem) => void;
  setMode: (mode: ReplacingFormModesType) => void;
}

export function ReplacingCards({
  selectedNovelId,
  setReplacement,
  setMode,
  ...props
}: ReplacingFormProps) {
  const replacementsOfNovel = useGetReplacements({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'from', direction: 'asc' },
    query: { novelId: selectedNovelId },
  });

  if (replacementsOfNovel.isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <>
      {replacementsOfNovel.data?.data?.data?.length &&
      replacementsOfNovel.data?.data?.data?.length > 0 ? (
        <Stack gap="xs" {...props}>
          {replacementsOfNovel.data?.data?.data?.map((replacement) => (
            <Group
              key={replacement.id}
              justify="space-between"
              p="xs"
              style={{ border: '1px solid #ddd', borderRadius: '4px' }}
              onClick={() => {
                setReplacement(replacement);
                setMode('edit');
              }}
            >
              <div>
                <Text fw={500}>{replacement.from}</Text>
                <Text size="sm" c="dimmed">
                  {replacement.to}
                </Text>
              </div>
            </Group>
          ))}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed">
          No replacements found
        </Text>
      )}
    </>
  );
}
