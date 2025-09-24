import { Button, Group, Stack, Text } from '@mantine/core';
import { useAtom } from 'jotai';
import { localeAtom } from '@/store/locale';
import { useTranslation } from 'react-i18next';

export function GeneralTab() {
  const { t } = useTranslation();
  const [locale, setLocale] = useAtom(localeAtom);
  function handleChangeLanguage() {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }
  return (
    <Stack gap="xs">
      <Group>
        <Text>{t('settings.language')}:</Text>
        <Button onClick={handleChangeLanguage}>
          {locale === 'ar' ? 'English' : 'Arabic'}
        </Button>
      </Group>
    </Stack>
  );
}
