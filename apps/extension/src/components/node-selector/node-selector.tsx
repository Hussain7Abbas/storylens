import { Button, Stack } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeSelectorForm } from './node-selector-form';
import { NodeSelectorTable } from './node-selector-table';

export function NodeSelector() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editedWebsite, setEditedWebsite] = useState<string | undefined>(undefined);

  function handleShowForm() {
    setShowForm(true);
    setEditedWebsite(undefined);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditedWebsite(undefined);
  }

  function handleEdit(website: string) {
    setEditedWebsite(website);
    setShowForm(true);
  }

  return (
    <Stack gap="xs">
      {showForm && (
        <NodeSelectorForm onClose={handleCloseForm} editedWebsite={editedWebsite} />
      )}
      {!showForm && <Button onClick={handleShowForm}>{t('_.add')}</Button>}
      <NodeSelectorTable onEdit={handleEdit} />
    </Stack>
  );
}
