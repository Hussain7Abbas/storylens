import { Stack, Loader, Group, Text, type StackProps, Center } from '@mantine/core';
import { useGetKeywords } from '@repo/api/keywords.js';
import type { GetKeywords200DataItem } from '@repo/api/schemas';
import type { ColoringFormModesType } from './coloring-form';

interface ColoringFormProps extends StackProps {
  selectedNovelId: string;
  setKeyword: (keyword: GetKeywords200DataItem) => void;
  setMode: (mode: ColoringFormModesType) => void;
}

export function ColoringCards({
  selectedNovelId,
  setKeyword,
  setMode,
  ...props
}: ColoringFormProps) {
  const keywordsOfNovel = useGetKeywords({
    pagination: { page: 1, pageSize: 100 },
    sorting: { column: 'name', direction: 'asc' },
    query: { novelId: selectedNovelId },
  });

  if (keywordsOfNovel.isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <>
      {keywordsOfNovel.data?.data?.data?.length &&
      keywordsOfNovel.data?.data?.data?.length > 0 ? (
        <Stack gap="xs" {...props}>
          {keywordsOfNovel.data?.data?.data?.map((keyword) => (
            <Group
              key={keyword.id}
              justify="space-between"
              p="xs"
              style={{ border: '1px solid #ddd', borderRadius: '4px' }}
              onClick={() => {
                setKeyword(keyword);
                setMode('edit');
              }}
            >
              <div>
                <Text fw={500}>{keyword.name}</Text>
                <Text size="sm" c="dimmed">
                  {keyword.description}
                </Text>
                <Group gap="xs" mt="xs">
                  <Text size="xs" style={{ color: keyword.category.color }}>
                    {keyword.category.name}
                  </Text>
                  <Text size="xs" style={{ color: keyword.nature.color }}>
                    {keyword.nature.name}
                  </Text>
                </Group>
              </div>
            </Group>
          ))}
        </Stack>
      ) : (
        <Text ta="center" c="dimmed">
          No keywords found
        </Text>
      )}
    </>
  );
}
