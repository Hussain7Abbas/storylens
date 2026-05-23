import { Button, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { ColoringFormModesType } from './coloring-form';
import { ColoringForm } from './coloring-form';
import { ColoringCards } from './coloring-cards';
import type { GetKeywords200DataItem } from '@repo/api/schemas';
import { SearchInput } from '@/components/search-input';

export function ColoringTab({ selectedNovelId }: { selectedNovelId: string }) {
  const { t } = useTranslation();
  const [coloringFormMode, setColoringFormMode] =
    useState<ColoringFormModesType>(undefined);
  const [keyword, setKeyword] = useState<GetKeywords200DataItem | undefined>(
    undefined,
  );
  const [search, setSearch] = useState('');

  return (
    <Stack gap="xs" p="xs">
      {coloringFormMode ? (
        <ColoringForm
          mode={coloringFormMode}
          selectedNovelId={selectedNovelId}
          hidden={!coloringFormMode}
          keyword={keyword}
          onClose={() => setColoringFormMode(undefined)}
        />
      ) : (
        <>
          <Button
            type="submit"
            variant="light"
            color="green.7"
            onClick={() => {
              setKeyword(undefined);
              setColoringFormMode('add');
            }}
            hidden={!!coloringFormMode}
            fullWidth
          >
            {t('_.add')}
          </Button>
          <SearchInput
            value={search}
            onChange={setSearch}
            w="100%"
            variant="default"
          />
          <ColoringCards
            selectedNovelId={selectedNovelId}
            search={search}
            setKeyword={setKeyword}
            setMode={setColoringFormMode}
          />
        </>
      )}
    </Stack>
  );
}
