import { Button, Stack } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeSelectorForm } from './node-selector-form';
import { NodeSelectorTable } from './node-selector-table';

export function NodeSelector() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState<string | undefined>(undefined);

  function handleShowForm() {
    setShowForm(true);
    setCurrentWebsite(undefined);
  }

  function handleCloseForm() {
    setShowForm(false);
    setCurrentWebsite(undefined);
  }

  function handleEdit(website: string) {
    setCurrentWebsite(website);
    setShowForm(true);
  }

  return (
    <Stack gap="xs">
      {showForm && (
        <NodeSelectorForm onClose={handleCloseForm} currentWebsite={currentWebsite} />
      )}
      {!showForm && <Button onClick={handleShowForm}>{t('_.add')}</Button>}
      <NodeSelectorTable onEdit={handleEdit} />
    </Stack>
  );
}
