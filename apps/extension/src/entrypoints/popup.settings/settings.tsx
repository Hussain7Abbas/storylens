import { Button, Container } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { i18n } = useTranslation();
  function handleChangeLanguage() {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  }

  return (
    <Container p="md" dir="rtl">
      <Button onClick={handleChangeLanguage}>
        {i18n.language === 'ar' ? 'English' : 'Arabic'}
      </Button>
    </Container>
  );
}
