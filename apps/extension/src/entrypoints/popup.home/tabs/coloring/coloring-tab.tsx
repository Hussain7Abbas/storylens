import { Button, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { ColoringFormModesType } from './coloring-form';
import { ColoringForm } from './coloring-form';
import { ColoringCards } from './coloring-cards';
import type { GetKeywords200DataItem } from '@repo/api/schemas';

export function ColoringTab({ selectedNovelId }: { selectedNovelId: string }) {
  const { t } = useTranslation();
  const [coloringFormMode, setColoringFormMode] =
    useState<ColoringFormModesType>(undefined);
  const [keyword, setKeyword] = useState<GetKeywords200DataItem | undefined>(
    undefined,
  );

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
          <ColoringCards
            selectedNovelId={selectedNovelId}
            setKeyword={setKeyword}
            setMode={setColoringFormMode}
          />
        </>
      )}
    </Stack>
  );
}
