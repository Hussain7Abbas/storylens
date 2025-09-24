import { localeAtom } from '@/store/locale';
import { Button, Container } from '@mantine/core';
import { useAtom } from 'jotai';

export function SettingsPage() {
  const [locale, setLocale] = useAtom(localeAtom);

  function handleChangeLanguage() {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }

  return (
    <Container p="md">
      <Button onClick={handleChangeLanguage}>
        {locale === 'ar' ? 'English' : 'Arabic'}
      </Button>
    </Container>
  );
}
