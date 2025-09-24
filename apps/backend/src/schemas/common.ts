import { t } from 'elysia';

export const paginationSchema = t.Object({
  page: t.Number(),
  pageSize: t.Number(),
});

export const sortingSchema = t.Object({
  column: t.String(),
  direction: t.Enum({ asc: 'asc', desc: 'desc' }),
});

export const errorSchema = t.Object({
  message: t.String(),
});
