import { t } from 'elysia';

export const paginationSchema = t.Object({
  page: t.Number(),
  limit: t.Number(),
});

export const sortingSchema = t.Object({
  column: t.String(),
  direction: t.Enum({ asc: 'asc', desc: 'desc' }),
});

export const errorSchema = t.Object({
  message: t.String(),
});
