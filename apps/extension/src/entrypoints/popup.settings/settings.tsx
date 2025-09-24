import { localeAtom } from '@/store/locale';
import { Button, Container } from '@mantine/core';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const [locale, setLocale] = useAtom(localeAtom);
  const { i18n } = useTranslation();

  function handleChangeLanguage() {
    setLocale(locale === 'ar' ? 'en' : 'ar');
    // FIXME: global state not changing the language in App.tsx fix it later
    i18n.changeLanguage(locale);
  }

  return (
    <Container p="md" dir="rtl">
      <Button onClick={handleChangeLanguage}>
        {locale === 'ar' ? 'English' : 'Arabic'}
      </Button>
    </Container>
  );
}
