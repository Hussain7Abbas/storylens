import { t } from 'elysia';

import { __transformDate__ } from './__transformDate__';

import { __nullable__ } from './__nullable__';

export const KeywordNaturePlain = t.Object(
  {
    id: t.String(),
    name: t.String(),
    color: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const KeywordNatureRelations = t.Object(
  {
    keywords: t.Array(
      t.Object(
        {
          id: t.String(),
          name: t.String(),
          description: t.String(),
          categoryId: t.String(),
          natureId: t.String(),
          imageId: __nullable__(t.String()),
          parentId: __nullable__(t.String()),
          novelId: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const KeywordNaturePlainInputCreate = t.Object(
  { name: t.String(), color: t.String() },
  { additionalProperties: false },
);

export const KeywordNaturePlainInputUpdate = t.Object(
  { name: t.Optional(t.String()), color: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const KeywordNatureRelationsInputCreate = t.Object(
  {
    keywords: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const KeywordNatureRelationsInputUpdate = t.Partial(
  t.Object(
    {
      keywords: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const KeywordNatureWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          name: t.String(),
          color: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: 'KeywordNature' },
  ),
);

export const KeywordNatureWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(t.Object({ id: t.String() }, { additionalProperties: false }), {
          additionalProperties: false,
        }),
        t.Union([t.Object({ id: t.String() })], {
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
              name: t.String(),
              color: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: 'KeywordNature' },
);

export const KeywordNatureSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      color: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      keywords: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const KeywordNatureInclude = t.Partial(
  t.Object(
    { keywords: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const KeywordNatureOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal('asc'), t.Literal('desc')], {
        additionalProperties: false,
      }),
      color: t.Union([t.Literal('asc'), t.Literal('desc')], {
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

export const KeywordNature = t.Composite(
  [KeywordNaturePlain, KeywordNatureRelations],
  { additionalProperties: false },
);

export const KeywordNatureInputCreate = t.Composite(
  [KeywordNaturePlainInputCreate, KeywordNatureRelationsInputCreate],
  { additionalProperties: false },
);

export const KeywordNatureInputUpdate = t.Composite(
  [KeywordNaturePlainInputUpdate, KeywordNatureRelationsInputUpdate],
  { additionalProperties: false },
);
