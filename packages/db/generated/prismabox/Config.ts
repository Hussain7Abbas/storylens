import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const ConfigPlain = t.Object(
  {
    id: t.String(),
    key: t.String(),
    value: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const ConfigRelations = t.Object({}, { additionalProperties: false });

export const ConfigPlainInputCreate = t.Object(
  { key: t.String(), value: t.String() },
  { additionalProperties: false },
);

export const ConfigPlainInputUpdate = t.Object(
  { key: t.Optional(t.String()), value: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const ConfigRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const ConfigRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const ConfigWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          key: t.String(),
          value: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'Config' },
  ),
);

export const ConfigWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), key: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.String() }), t.Object({ key: t.String() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
            NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.String(),
              key: t.String(),
              value: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'Config' },
);

export const ConfigSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      key: t.Boolean(),
      value: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ConfigInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const ConfigOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      key: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      value: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Config = t.Composite([ConfigPlain, ConfigRelations], {
  additionalProperties: false,
});

export const ConfigInputCreate = t.Composite(
  [ConfigPlainInputCreate, ConfigRelationsInputCreate],
  { additionalProperties: false },
);

export const ConfigInputUpdate = t.Composite(
  [ConfigPlainInputUpdate, ConfigRelationsInputUpdate],
  { additionalProperties: false },
);
